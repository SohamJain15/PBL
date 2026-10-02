from __future__ import annotations

import threading
from dataclasses import dataclass

import numpy as np
import pandas as pd

from app.data.repositories.match_repository import MatchRepository
from app.schemas.goal import GoalAnalysisOut, GoalEventOut, GoalFactorOut
from app.services.feature_service import FeatureService
from app.services.pattern_service import PatternService
from app.utils.time import format_clock


@dataclass(frozen=True)
class _Metric:
    key: str
    label: str
    unit: str
    weakness_direction: int
    attacking_direction: int


METRICS = (
    _Metric("compactness", "Compactness", "", -1, -1),
    _Metric("near_ball_10", "Players within 10 m of ball", "players", -1, 1),
    _Metric("ball_centroid_dist", "Ball to team centroid", "m", 1, 1),
    _Metric("width", "Team width", "m", 1, 1),
    _Metric("area", "Team area", "m²", 1, 1),
    _Metric("possession_share", "Possession share", "%", -1, 1),
)


class GoalService:
    def __init__(self, repo: MatchRepository, features: FeatureService, patterns: PatternService) -> None:
        self.repo = repo
        self.features = features
        self.patterns = patterns
        self._goals: dict[int, list[GoalEventOut]] = {}
        self._analysis: dict[tuple[int, int], GoalAnalysisOut] = {}
        self._lock = threading.Lock()

    def goals(self, match_id: int) -> list[GoalEventOut]:
        if match_id not in self._goals:
            with self._lock:
                if match_id not in self._goals:
                    self._goals[match_id] = self._extract_goals(match_id)
        return self._goals[match_id]

    def analysis(self, match_id: int, goal_id: int) -> GoalAnalysisOut:
        key = (match_id, goal_id)
        if key not in self._analysis:
            goal = next((item for item in self.goals(match_id) if item.id == goal_id), None)
            if goal is None:
                raise ValueError(f"Unknown goal {goal_id}")
            self._analysis[key] = self._build_analysis(match_id, goal)
        return self._analysis[key]

    def _extract_goals(self, match_id: int) -> list[GoalEventOut]:
        events = self.repo.get_dynamic_events(match_id)
        if events is None or events.empty:
            return []
        meta = self.repo.get_meta(match_id)
        home_id, away_id = meta.home.id, meta.away.id
        rows = events.sort_values(["frame_start", "index"], kind="stable")
        previous = (0, 0)
        goals: list[GoalEventOut] = []
        for row in rows.itertuples(index=False):
            team_score = _number(row.team_score)
            opponent_score = _number(row.opponent_team_score)
            if row.team_id == home_id:
                score = (team_score, opponent_score)
                scoring_side, scoring_team = "home", meta.home.name
                conceding_side, conceding_team = "away", meta.away.name
            elif row.team_id == away_id:
                score = (opponent_score, team_score)
                scoring_side, scoring_team = "away", meta.away.name
                conceding_side, conceding_team = "home", meta.home.name
            else:
                continue
            if score[0] < previous[0] or score[1] < previous[1]:
                continue
            if score == previous:
                continue
            if score[0] == previous[0] + 1:
                scoring_side, scoring_team = "home", meta.home.name
            elif score[1] == previous[1] + 1:
                scoring_side, scoring_team = "away", meta.away.name
            else:
                previous = score
                continue
            goals.append(GoalEventOut(
                id=len(goals), period=int(row.period), time_s=_clock_seconds(row.time_start),
                clock=str(row.time_start), frame=int(row.frame_start), scoring_side=scoring_side,
                scoring_team=scoring_team, conceding_side="away" if scoring_side == "home" else "home",
                conceding_team=meta.away.name if scoring_side == "home" else meta.home.name,
                home_score=score[0], away_score=score[1],
                player_name=str(row.player_name) if _text(row.player_name) else None,
            ))
            previous = score
        return goals

    def _build_analysis(self, match_id: int, goal: GoalEventOut) -> GoalAnalysisOut:
        window_start = max(0.0, goal.time_s - 15.0)
        window_end = goal.time_s
        series = self.features.match_series(match_id)
        tr = self.repo.get_tracking(match_id)
        factors: dict[str, list[GoalFactorOut]] = {"home": [], "away": []}
        for side in ("home", "away"):
            shape = series[side]
            period_mask = tr.period[shape.frame_index] == goal.period
            before = period_mask & (shape.t >= window_start) & (shape.t <= window_end) & shape.valid
            whole = period_mask & shape.valid
            for metric in METRICS:
                values = shape.in_possession.astype(float) if metric.key == "possession_share" else getattr(shape, metric.key)
                value = _mean(values, before)
                baseline = _mean(values, whole)
                deviation = _z_score(values[before], values[whole])
                direction = metric.weakness_direction if side == goal.conceding_side else metric.attacking_direction
                signal = (deviation or 0.0) * direction
                if signal < 0.45:
                    continue
                factors[side].append(GoalFactorOut(
                    key=metric.key, label=metric.label, unit=metric.unit,
                    value=_round(value), baseline=_round(baseline), z_score=_round(deviation),
                    direction="below baseline" if deviation is not None and deviation < 0 else "above baseline",
                    explanation=_explanation(metric, side == goal.conceding_side, deviation),
                ))
            factors[side].sort(key=lambda item: abs(item.z_score or 0), reverse=True)

        pattern_cluster, pattern_label = self._pattern_at(match_id, goal)
        phase = self._phase_at(match_id, goal.frame, goal.conceding_side)
        return GoalAnalysisOut(
            goal=goal, window_start_s=window_start, window_end_s=window_end,
            conceding_factors=factors[goal.conceding_side][:4], attacking_factors=factors[goal.scoring_side][:4],
            pattern_cluster=pattern_cluster, pattern_label=pattern_label, phase=phase,
        )

    def _pattern_at(self, match_id: int, goal: GoalEventOut) -> tuple[int | None, str | None]:
        try:
            summary = self.patterns.summary(match_id)
        except Exception:
            return None, None
        candidates = [e for e in summary.episodes if e.side == goal.conceding_side and e.period == goal.period and e.start_s <= goal.time_s <= e.end_s]
        if not candidates:
            return None, None
        episode = min(candidates, key=lambda item: abs(item.end_s - goal.time_s))
        cluster = next((c for c in summary.clusters if c.id == episode.cluster_id), None)
        return episode.cluster_id, cluster.interpretation.label if cluster else None

    def _phase_at(self, match_id: int, frame: int, side: str) -> str | None:
        phases = self.repo.get_phases(match_id)
        if phases is None or phases.empty:
            return None
        rows = phases[(phases.frame_start <= frame) & (phases.frame_end >= frame)]
        if rows.empty:
            return None
        row = rows.iloc[0]
        meta = self.repo.get_meta(match_id)
        in_possession = int(row.team_in_possession_id) == (meta.home.id if side == "home" else meta.away.id)
        return str(row.team_in_possession_phase_type if in_possession else row.team_out_of_possession_phase_type)


def _number(value: object) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return 0


def _text(value: object) -> str:
    return "" if value is None or (isinstance(value, float) and np.isnan(value)) else str(value).strip()


def _clock_seconds(value: object) -> float:
    text = _text(value)
    try:
        minute, second = text.split(":")
        return int(minute) * 60 + float(second)
    except (ValueError, AttributeError):
        return 0.0


def _mean(values: np.ndarray, mask: np.ndarray) -> float | None:
    selected = values[mask]
    return float(np.nanmean(selected)) if selected.size and np.isfinite(selected).any() else None


def _z_score(window: np.ndarray, baseline: np.ndarray) -> float | None:
    if not window.size or not baseline.size:
        return None
    std = float(np.nanstd(baseline))
    if std < 1e-6:
        return 0.0
    return (float(np.nanmean(window)) - float(np.nanmean(baseline))) / std


def _round(value: float | None) -> float | None:
    return None if value is None or not np.isfinite(value) else round(value, 3)


def _explanation(metric: _Metric, conceding: bool, z_score: float | None) -> str:
    direction = "below" if z_score is not None and z_score < 0 else "above"
    subject = "defensive shape" if conceding else "attacking shape"
    return f"{metric.label} was {direction} this team's match baseline in the 15 seconds before the goal, a possible {subject} signal."