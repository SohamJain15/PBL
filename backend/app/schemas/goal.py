from __future__ import annotations

from pydantic import BaseModel


class GoalEventOut(BaseModel):
    id: int
    period: int
    time_s: float
    clock: str
    frame: int
    scoring_side: str
    scoring_team: str
    conceding_side: str
    conceding_team: str
    home_score: int
    away_score: int
    player_name: str | None


class GoalFactorOut(BaseModel):
    key: str
    label: str
    unit: str
    value: float | None
    baseline: float | None
    z_score: float | None
    direction: str
    explanation: str


class GoalAnalysisOut(BaseModel):
    goal: GoalEventOut
    window_start_s: float
    window_end_s: float
    conceding_factors: list[GoalFactorOut]
    attacking_factors: list[GoalFactorOut]
    pattern_cluster: int | None
    pattern_label: str | None
    phase: str | None