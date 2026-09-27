from __future__ import annotations

from pydantic import BaseModel


class TeamOut(BaseModel):
    id: int
    name: str
    short_name: str
    acronym: str
    side: str
    color: str
    number_color: str


class PlayerOut(BaseModel):
    id: int
    team_id: int
    side: str
    number: int | None
    short_name: str
    role: str
    is_goalkeeper: bool


class PeriodOut(BaseModel):
    period: int
    start_s: float
    end_s: float
    home_direction: int


class MatchListItem(BaseModel):
    id: int
    date_time: str
    home_team: str
    away_team: str
    metadata_available: bool
    tracking_available: bool


class QualityOut(BaseModel):
    frames: int
    frames_with_players: int
    detected: int
    extrapolated: int
    missing: int
    ball_detected: int
    ball_extrapolated: int
    ball_missing: int


class MatchDetail(BaseModel):
    id: int
    sport: str
    competition: str
    season: str
    round_name: str | None
    date_time: str
    stadium: str | None
    home_score: int | None
    away_score: int | None
    home: TeamOut
    away: TeamOut
    pitch_length: float
    pitch_width: float
    fps: int
    periods: list[PeriodOut]
    players: list[PlayerOut]
    tracking_available: bool
    quality: QualityOut | None
