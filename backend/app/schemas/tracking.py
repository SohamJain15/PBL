from __future__ import annotations

from pydantic import BaseModel, Field


class FrameChunk(BaseModel):
    """Columnar frames for a time range. Player arrays follow ``player_ids`` order.

    xy[f] = [x0, y0, x1, y1, ...] (null when the player is absent)
    flag[f] = [-1 missing | 0 extrapolated | 1 detected, ...]
    ball[f] = [x, y, z, flag] (nulls when missing)
    possession[f] = 0 none | 1 home | 2 away
    possession_player[f] = player id in possession (null if none)
    """

    match_id: int
    period: int
    start_s: float
    end_s: float
    fps: int
    player_ids: list[int]
    t: list[float]
    frame: list[int]
    xy: list[list[float | None]]
    flag: list[list[int]]
    ball: list[list[float | None]]
    possession: list[int]
    possession_player: list[int | None]


class TeamShapeSeriesOut(BaseModel):
    side: str
    t: list[float]
    width: list[float | None]
    depth: list[float | None]
    area: list[float | None]
    compactness: list[float | None]
    stretch: list[float | None]
    centroid: list[list[float] | None] = Field(description="raw pitch coordinates")
    hull: list[list[float] | None] = Field(description="flat [x0,y0,x1,y1,...] raw pitch coordinates")
    near_ball_10: list[float | None]
    near_ball_20: list[float | None]
    density: list[float | None]


class PlayerStatOut(BaseModel):
    player_id: int
    distance_m: float
    mean_speed: float | None
    max_speed: float | None
    max_accel: float | None
    heading_deg: float | None
    coverage: float
    duration_s: float


class RangeFeatures(BaseModel):
    match_id: int
    period: int
    start_s: float
    end_s: float
    hz: int
    teams: list[TeamShapeSeriesOut]
    players: list[PlayerStatOut]
