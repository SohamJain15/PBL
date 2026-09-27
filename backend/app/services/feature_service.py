"""Feature extraction service: frame-level shape series, window tables, player kinematics."""
from __future__ import annotations

import threading
from dataclasses import fields

import numpy as np
import pandas as pd

from app.analytics.spatial.team_shape import FootballTeamShapeExtractor
from app.analytics.temporal.dynamics import kinematics
from app.analytics.temporal.windows import sliding_windows
from app.core.constants import COORD_DECIMALS, EDGE_SPAN_S, FEATURE_SAMPLE_HZ, MAX_FEATURE_WINDOW_S, TRACKING_FPS
from app.core.logging import get_logger
from app.data.repositories.match_repository import MatchRepository
from app.ml.representation.sequence_features import build_window_table
from app.models.feature import ShapeSeries
from app.schemas.feature import MetricSummary, ShapeTimelineOut, TeamWindowSummary, WindowSummaryOut
from app.schemas.tracking import PlayerStatOut, RangeFeatures, TeamShapeSeriesOut
from app.utils.validation import validate_range

log = get_logger(__name__)
SIDES = ("home", "away")
SERIES_CACHE_VERSION = "v1"
_SERIES_KEYS = ("width", "depth", "area", "compactness", "stretch", "near_ball_10", "near_ball_20", "density")
TIMELINE_KEYS = ("width", "depth", "area", "compactness")
SUMMARY_KEYS = ("width", "depth", "area", "compactness", "stretch", "near_ball_10", "density", "ball_centroid_dist")


def _clean(values: np.ndarray, decimals: int = COORD_DECIMALS) -> list[float | None]:
    return [None if not np.isfinite(v) else round(float(v), decimals) for v in values]


def _series_to_frame(s: ShapeSeries) -> pd.DataFrame:
    return pd.DataFrame({f.name: getattr(s, f.name) for f in fields(s) if f.name != "side"})


def _frame_to_series(side: str, df: pd.DataFrame) -> ShapeSeries:
    return ShapeSeries(side=side, **{c: df[c].to_numpy() for c in df.columns})


class FeatureService:
    def __init__(self, repo: MatchRepository, features_dir) -> None:  # type: ignore[no-untyped-def]
        self.repo = repo
        self.features_dir = features_dir
        self._series: dict[int, dict[str, ShapeSeries]] = {}
        self._tables: dict[tuple[int, float, float], pd.DataFrame] = {}
        self._lock = threading.Lock()

    def extractor(self, match_id: int) -> FootballTeamShapeExtractor:
        meta = self.repo.get_meta(match_id)
        return FootballTeamShapeExtractor(meta, self.repo.get_tracking(match_id))

    # ---- full-match sampled series (cached) --------------------------------------
    def sample_indices(self, match_id: int) -> np.ndarray:
        tr = self.repo.get_tracking(match_id)
        stride = TRACKING_FPS // FEATURE_SAMPLE_HZ
        parts = [tr.period_indices(p)[::stride] for p in np.unique(tr.period[tr.period > 0])]
        return np.concatenate(parts) if parts else np.array([], dtype=int)

    def match_series(self, match_id: int) -> dict[str, ShapeSeries]:
        with self._lock:
            if match_id in self._series:
                return self._series[match_id]
            path = self.features_dir / f"{match_id}_shape_{FEATURE_SAMPLE_HZ}hz_{SERIES_CACHE_VERSION}.pkl"
            if path.exists():
                stored: dict[str, pd.DataFrame] = pd.read_pickle(path)
                series = {side: _frame_to_series(side, df) for side, df in stored.items()}
            else:
                log.info("Extracting %d Hz team-shape series for match %s", FEATURE_SAMPLE_HZ, match_id)
                ex = self.extractor(match_id)
                idx = self.sample_indices(match_id)
                series = {side: ex.series(side, idx)[0] for side in SIDES}
                path.parent.mkdir(parents=True, exist_ok=True)
                pd.to_pickle({side: _series_to_frame(s) for side, s in series.items()}, path)
            self._series[match_id] = series
            return series

    def window_table(self, match_id: int, window_s: float, step_s: float) -> pd.DataFrame:
        key = (match_id, round(window_s, 3), round(step_s, 3))
        if key not in self._tables:
            series = self.match_series(match_id)
            tr = self.repo.get_tracking(match_id)
            ref = series["home"]
            windows = sliding_windows(
                ref.t, tr.period[ref.frame_index], window_s, step_s, 1.0 / FEATURE_SAMPLE_HZ
            )
            self._tables[key] = build_window_table(series, windows, 1.0 / FEATURE_SAMPLE_HZ)
        return self._tables[key]

    # ---- external reference labels (SkillCorner phases of play) --------------------
    def reference_labels(self, match_id: int, table: pd.DataFrame) -> pd.Series | None:
        phases = self.repo.get_phases(match_id)
        if phases is None or table.empty:
            return None
        meta = self.repo.get_meta(match_id)
        tr = self.repo.get_tracking(match_id)
        team_ids = {"home": meta.home.id, "away": meta.away.id}
        mid_frames = tr.frame[((table.start_index + table.end_index) // 2).to_numpy()]
        starts, ends = phases.frame_start.to_numpy(), phases.frame_end.to_numpy()
        pos = np.searchsorted(starts, mid_frames, side="right") - 1
        labels: list[str | None] = []
        for k, (p, f) in enumerate(zip(pos, mid_frames)):
            if p < 0 or f > ends[p]:
                labels.append(None)
                continue
            row = phases.iloc[p]
            own = int(row.team_in_possession_id) == team_ids[str(table.side.iloc[k])]
            phase = row.team_in_possession_phase_type if own else row.team_out_of_possession_phase_type
            labels.append(f"{'IP' if own else 'OOP'}:{phase}" if isinstance(phase, str) else None)
        return pd.Series(labels, index=table.index, dtype=object)

    # ---- range-level (playback) ------------------------------------------------------
    def range_shapes(self, match_id: int, indices: np.ndarray) -> dict[str, tuple[ShapeSeries, list[np.ndarray | None]]]:
        ex = self.extractor(match_id)
        return {side: ex.series(side, indices, with_hulls=True) for side in SIDES}

    def player_stats(self, match_id: int, indices: np.ndarray) -> list[dict[str, float | int]]:
        tr = self.repo.get_tracking(match_id)
        stats: list[dict[str, float | int]] = []
        duration = indices.size / TRACKING_FPS
        for j, pid in enumerate(tr.player_ids):
            xy = tr.xy[indices, j].astype(float)
            present = np.all(np.isfinite(xy), axis=1)
            if present.sum() < 2:
                continue
            k = kinematics(xy)
            with np.errstate(all="ignore"):
                stats.append({
                    "player_id": int(pid),
                    "distance_m": round(k.distance_m, 1),
                    "mean_speed": round(float(np.nanmean(k.speed)), 2) if np.isfinite(k.speed).any() else None,
                    "max_speed": round(float(np.nanmax(k.speed)), 2) if np.isfinite(k.speed).any() else None,
                    "max_accel": round(float(np.nanmax(np.abs(k.acceleration))), 2)
                    if np.isfinite(k.acceleration).any() else None,
                    "heading_deg": round(float(k.heading_deg[np.isfinite(k.heading_deg)][-1]), 0)
                    if np.isfinite(k.heading_deg).any() else None,
                    "coverage": round(float(present.sum() / max(1, indices.size)), 3),
                    "duration_s": duration,
                })
        return stats


    # ---- API payloads ------------------------------------------------------------------
    def range_features(self, match_id: int, period: int, start_s: float, end_s: float) -> RangeFeatures:
        """10 Hz team shape (incl. hull polygons) + player kinematics for a playback chunk."""
        validate_range(start_s, end_s, MAX_FEATURE_WINDOW_S)
        self.repo.get_meta(match_id)
        tr = self.repo.get_tracking(match_id)
        idx = tr.range_indices(period, start_s, end_s)
        ex = self.extractor(match_id)
        teams = []
        for side in SIDES:
            s, hulls = ex.series(side, idx, with_hulls=True)
            centroids: list[list[float] | None] = []
            for k, i in enumerate(idx):
                if not s.valid[k]:
                    centroids.append(None)
                    continue
                c = ex.team_points(int(i), side).mean(axis=0)
                centroids.append([round(float(c[0]), COORD_DECIMALS), round(float(c[1]), COORD_DECIMALS)])
            teams.append(TeamShapeSeriesOut(
                side=side,
                t=[round(float(v), 2) for v in s.t],
                centroid=centroids,
                hull=[None if h is None else [round(float(v), COORD_DECIMALS) for v in h.ravel()] for h in hulls],
                **{k: _clean(getattr(s, k), 3 if k == "compactness" else COORD_DECIMALS) for k in _SERIES_KEYS},
            ))
        players = [PlayerStatOut(**p) for p in self.player_stats(match_id, idx)]  # type: ignore[arg-type]
        return RangeFeatures(match_id=match_id, period=period, start_s=start_s, end_s=end_s,
                             hz=TRACKING_FPS, teams=teams, players=players)

    def shape_timeline(self, match_id: int, period: int, bin_s: float) -> ShapeTimelineOut:
        """Team shape averaged in ``bin_s`` bins across a period (valid samples only)."""
        series = self.match_series(match_id)
        tr = self.repo.get_tracking(match_id)
        frames: dict[str, pd.DataFrame] = {}
        for side, s in series.items():
            df = s.as_frame()
            df = df[(tr.period[s.frame_index] == period) & s.valid]
            df = df.assign(bin=np.floor(df.t / bin_s) * bin_s)
            frames[side] = df.groupby("bin")[list(TIMELINE_KEYS)].mean()
        bins = frames["home"].index.union(frames["away"].index)
        out = {
            side: {k: _clean(df.reindex(bins)[k].to_numpy(), 3 if k == "compactness" else 1) for k in TIMELINE_KEYS}
            for side, df in frames.items()
        }
        return ShapeTimelineOut(match_id=match_id, period=period, bin_s=bin_s,
                                t=[float(v) for v in bins], home=out["home"], away=out["away"])

    def window_summary(self, match_id: int, period: int, start_s: float, end_s: float) -> WindowSummaryOut:
        """Mean and start/end (first/last second) of each shape metric over an arbitrary window."""
        validate_range(start_s, end_s, 1e9)
        series = self.match_series(match_id)
        tr = self.repo.get_tracking(match_id)
        edge = max(1, int(round(EDGE_SPAN_S * FEATURE_SAMPLE_HZ)))
        teams = []
        for side, s in series.items():
            mask = (tr.period[s.frame_index] == period) & (s.t >= start_s) & (s.t <= end_s)
            valid = s.valid[mask]
            metrics: dict[str, MetricSummary] = {}
            for key in SUMMARY_KEYS:
                v = getattr(s, key)[mask]
                with np.errstate(all="ignore"):
                    vals = [float(np.nanmean(v)) if v.size else np.nan,
                            float(np.nanmean(v[:edge])) if v.size >= edge else np.nan,
                            float(np.nanmean(v[-edge:])) if v.size >= edge else np.nan]
                digits = 3 if key == "compactness" else 2
                mean, first, last = (None if not np.isfinite(x) else round(x, digits) for x in vals)
                metrics[key] = MetricSummary(mean=mean, start=first, end=last)
            teams.append(TeamWindowSummary(
                side=side,
                valid_share=round(float(valid.mean()), 3) if valid.size else 0.0,
                possession_share=round(float(s.in_possession[mask].mean()), 3) if valid.size else 0.0,
                metrics=metrics,
            ))
        return WindowSummaryOut(match_id=match_id, period=period, start_s=start_s, end_s=end_s, teams=teams)
