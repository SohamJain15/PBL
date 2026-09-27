from __future__ import annotations

from pydantic import BaseModel


class ShapeTimelineOut(BaseModel):
    """Team shape aggregated to fixed bins over a whole period (for the analysis view)."""

    match_id: int
    period: int
    bin_s: float
    t: list[float]
    home: dict[str, list[float | None]]
    away: dict[str, list[float | None]]


class HeatmapOut(BaseModel):
    match_id: int
    side: str
    period: int | None
    start_s: float | None
    end_s: float | None
    bin_m: float
    nx: int
    ny: int
    x_min: float
    y_min: float
    samples: int
    grid: list[list[float]]  # [ny][nx], sums to 1
    normalised_direction: bool


class MetricSummary(BaseModel):
    mean: float | None
    start: float | None
    end: float | None


class TeamWindowSummary(BaseModel):
    side: str
    valid_share: float
    possession_share: float
    metrics: dict[str, MetricSummary]


class WindowSummaryOut(BaseModel):
    match_id: int
    period: int
    start_s: float
    end_s: float
    teams: list[TeamWindowSummary]
