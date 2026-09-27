"""Orchestrates discovery runs, caching, and API payload assembly."""
from __future__ import annotations

import hashlib
import pickle
import threading

import numpy as np
import pandas as pd

from app.core.constants import (
    DEFAULT_STEP_S,
    DEFAULT_WINDOW_S,
    EDGE_SPAN_S,
    FEATURE_SAMPLE_HZ,
    MAX_EMBEDDING_POINTS,
    RANDOM_STATE,
)
from app.core.exceptions import InvalidRangeError
from app.core.logging import get_logger
from app.ml.clustering.kmeans import KMeansPatternMiner
from app.ml.discovery.pattern_discovery import PatternDiscovery
from app.ml.interpretation.tactical_interpreter import FootballPatternInterpreter
from app.ml.representation.sequence_features import CLUSTER_FEATURES, FEATURE_LABELS
from app.models.pattern import DiscoveryResult, Episode
from app.schemas.pattern import (
    ClusterDetail,
    ClusterSummary,
    DiscoverySummary,
    EmbeddingPoint,
    EpisodeDetail,
    EpisodeOut,
    FeatureChange,
    FeatureStat,
    InterpretationOut,
    PhaseAgreement,
)
from app.services.feature_service import FeatureService

log = get_logger(__name__)
DISCOVERY_CACHE_VERSION = "v1"
REPLAY_CONTEXT_S = 3.0  # seconds shown before/after an episode in tactical replay
DEMO_MIN_WINDOWS = 3

CHANGE_KEYS: tuple[tuple[str, str, str], ...] = (
    ("width", "Width", "m"),
    ("depth", "Depth", "m"),
    ("area", "Area", "m²"),
    ("compactness", "Compactness", ""),
    ("near_ball_10", "Players ≤10 m of ball", ""),
    ("density", "Ball-area density", "/100 m²"),
)


def _episode_out(e: Episode) -> EpisodeOut:
    return EpisodeOut(
        id=e.id, cluster_id=e.cluster_id, side=e.side, period=e.period, start_s=round(e.start_s, 1),
        end_s=round(e.end_s, 1), duration_s=round(e.duration_s, 1), n_windows=e.n_windows,
        distance_to_centroid=round(e.distance_to_centroid, 3),
    )


class PatternService:
    def __init__(self, features: FeatureService, cache_dir) -> None:  # type: ignore[no-untyped-def]
        self.features = features
        self.cache_dir = cache_dir
        self.interpreter = FootballPatternInterpreter()
        self._results: dict[tuple[int, float, float, int | None], DiscoveryResult] = {}
        self._summaries: dict[tuple[int, float, float, int | None], DiscoverySummary] = {}
        self._lock = threading.Lock()

    # ---- discovery ---------------------------------------------------------------------
    def result(self, match_id: int, window_s: float = DEFAULT_WINDOW_S, step_s: float = DEFAULT_STEP_S,
               k: int | None = None) -> DiscoveryResult:
        if step_s > window_s:
            raise InvalidRangeError("step must not exceed the window length")
        key = (match_id, round(window_s, 2), round(step_s, 2), k)
        with self._lock:
            if key in self._results:
                return self._results[key]
            path = self._cache_path(key)
            if path.exists():
                with path.open("rb") as fh:
                    res: DiscoveryResult = pickle.load(fh)
            else:
                table = self.features.window_table(match_id, window_s, step_s)
                if len(table) < 50:
                    raise InvalidRangeError("Too few valid windows for pattern discovery")
                ref = self.features.reference_labels(match_id, table)
                log.info("Running discovery on %d windows (match %s, %.1fs/%.1fs)", len(table), match_id, window_s, step_s)
                res = PatternDiscovery(KMeansPatternMiner(k), self.interpreter).run(match_id, table, window_s, step_s, ref)
                path.parent.mkdir(parents=True, exist_ok=True)
                with path.open("wb") as fh:
                    pickle.dump(res, fh)
            self._results[key] = res
            return res

    def summary(self, match_id: int, window_s: float = DEFAULT_WINDOW_S, step_s: float = DEFAULT_STEP_S,
                k: int | None = None) -> DiscoverySummary:
        key = (match_id, round(window_s, 2), round(step_s, 2), k)
        if key not in self._summaries:
            self._summaries[key] = self._build_summary(self.result(match_id, window_s, step_s, k))
        return self._summaries[key]

    # ---- detail --------------------------------------------------------------------------
    def cluster_detail(self, match_id: int, cluster_id: int, window_s: float, step_s: float, k: int | None) -> ClusterDetail:
        summary = self.summary(match_id, window_s, step_s, k)
        cluster = next((c for c in summary.clusters if c.id == cluster_id), None)
        if cluster is None:
            raise InvalidRangeError(f"Unknown cluster {cluster_id}")
        eps = sorted((e for e in summary.episodes if e.cluster_id == cluster_id), key=lambda e: e.distance_to_centroid)
        return ClusterDetail(cluster=cluster, episodes=eps)

    def episode_detail(self, match_id: int, episode_id: int, window_s: float, step_s: float, k: int | None) -> EpisodeDetail:
        summary = self.summary(match_id, window_s, step_s, k)
        if not 0 <= episode_id < len(summary.episodes):
            raise InvalidRangeError(f"Unknown episode {episode_id}")
        ep = summary.episodes[episode_id]
        cluster = next(c for c in summary.clusters if c.id == ep.cluster_id)
        return EpisodeDetail(
            episode=ep, cluster=cluster, changes=self._changes(match_id, ep),
            context_before_s=REPLAY_CONTEXT_S, context_after_s=REPLAY_CONTEXT_S,
        )

    def _changes(self, match_id: int, ep: EpisodeOut) -> list[FeatureChange]:
        """Start/end state of the episode measured on the 5 Hz series (mean of first/last second)."""
        s = self.features.match_series(match_id)[ep.side]
        tr = self.features.repo.get_tracking(match_id)
        mask = (tr.period[s.frame_index] == ep.period) & (s.t >= ep.start_s) & (s.t < ep.end_s)
        edge = max(1, int(round(EDGE_SPAN_S * FEATURE_SAMPLE_HZ)))
        out: list[FeatureChange] = []

        def edge_means(values: np.ndarray) -> tuple[float | None, float | None]:
            v = values[mask]
            if v.size < 2 * edge:
                return None, None
            with np.errstate(all="ignore"):
                a, b = float(np.nanmean(v[:edge])), float(np.nanmean(v[-edge:]))
            return (round(a, 3) if np.isfinite(a) else None, round(b, 3) if np.isfinite(b) else None)

        for key, label, unit in CHANGE_KEYS:
            a, b = edge_means(getattr(s, key))
            out.append(FeatureChange(key=key, label=label, unit=unit, start=a, end=b))
        cx, cy = edge_means(s.centroid_x), edge_means(s.centroid_y)
        out.append(FeatureChange(key="centroid_x", label="Centroid (forward)", unit="m", start=cx[0], end=cx[1]))
        out.append(FeatureChange(key="centroid_y", label="Centroid (lateral)", unit="m", start=cy[0], end=cy[1]))
        return out

    # ---- assembly -----------------------------------------------------------------------
    def _build_summary(self, res: DiscoveryResult) -> DiscoverySummary:
        w = res.windows
        episodes = [_episode_out(e) for e in res.episodes]
        clusters: list[ClusterSummary] = []
        for c in range(res.k):
            members = w[w.cluster == c]
            eps = [e for e in res.episodes if e.cluster_id == c]
            preferred = [e for e in eps if e.n_windows >= DEMO_MIN_WINDOWS] or eps
            rep = min(preferred, key=lambda e: e.distance_to_centroid) if preferred else None
            interp = res.interpretations[c]
            profile = [
                FeatureStat(key=f, label=FEATURE_LABELS[f][0], unit=FEATURE_LABELS[f][1],
                            mean=round(float(members[f].mean()), 3), z=round(float(res.cluster_centers_z[c][i]), 3))
                for i, f in enumerate(res.feature_columns)
            ]
            clusters.append(ClusterSummary(
                id=c,
                n_windows=int(len(members)),
                n_episodes=len(eps),
                avg_duration_s=round(float(np.mean([e.duration_s for e in eps])), 2) if eps else 0.0,
                side_share_home=round(float((members.side == "home").mean()), 3) if len(members) else 0.0,
                representative_episode_id=rep.id if rep else None,
                profile=profile,
                interpretation=InterpretationOut(label=interp.label, rules_matched=interp.rules_matched,
                                                 evidence=interp.evidence),
            ))

        sample = w if len(w) <= MAX_EMBEDDING_POINTS else w.sample(MAX_EMBEDDING_POINTS, random_state=RANDOM_STATE)
        embedding = [
            EmbeddingPoint(window_id=int(r.window_id), cluster_id=int(r.cluster), side=str(r.side), period=int(r.period),
                           start_s=float(r.start_s), x=round(float(r.pc1), 3), y=round(float(r.pc2), 3))
            for r in sample.itertuples()
        ]
        return DiscoverySummary(
            match_id=res.match_id,
            method="StandardScaler → K-Means (k by silhouette) · PCA for display",
            window_s=res.window_s,
            step_s=res.step_s,
            n_windows=int(len(w)),
            k=res.k,
            k_scores={int(k): round(v, 4) for k, v in res.k_scores.items()},
            pca_explained=[round(v, 4) for v in res.pca_explained],
            features=list(CLUSTER_FEATURES),
            clusters=clusters,
            episodes=episodes,
            embedding=embedding,
            phase_agreement=PhaseAgreement(**res.phase_agreement) if res.phase_agreement else None,
            rules=self.interpreter.rule_catalogue(),
            demo_episode_id=self._demo_episode(res, clusters),
            runtime_s=round(res.runtime_s, 2),
        )

    @staticmethod
    def _demo_episode(res: DiscoveryResult, clusters: list[ClusterSummary]) -> int | None:
        """Deterministic demo choice: the interpreted cluster with the largest shape change
        (|z width Δ| + |z area Δ|), then its representative episode."""
        fi = {f: i for i, f in enumerate(res.feature_columns)}
        candidates = [c for c in clusters if c.interpretation.label and c.representative_episode_id is not None]
        if not candidates:
            return None
        best = max(candidates, key=lambda c: abs(res.cluster_centers_z[c.id][fi["d_width"]])
                   + abs(res.cluster_centers_z[c.id][fi["d_area"]]))
        return best.representative_episode_id

    def _cache_path(self, key: tuple[int, float, float, int | None]):  # type: ignore[no-untyped-def]
        fingerprint = (key, CLUSTER_FEATURES, self.interpreter.rule_catalogue(), DISCOVERY_CACHE_VERSION)
        digest = hashlib.sha1(repr(fingerprint).encode()).hexdigest()[:12]
        return self.cache_dir / f"discovery_{key[0]}_{digest}.pkl"
