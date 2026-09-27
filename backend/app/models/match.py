"""Internal, source-agnostic match metadata."""
from __future__ import annotations

from dataclasses import dataclass, field

from app.models.sport import PlayingSurface


@dataclass(frozen=True)
class Team:
    id: int
    name: str
    short_name: str
    acronym: str
    side: str  # "home" | "away"
    color: str
    number_color: str


@dataclass(frozen=True)
class Player:
    id: int
    team_id: int
    side: str
    number: int | None
    short_name: str
    role: str  # role acronym as supplied by the provider, e.g. GK, CB, SUB
    is_goalkeeper: bool


@dataclass(frozen=True)
class Period:
    period: int
    start_frame: int
    end_frame: int
    start_s: float = 0.0
    end_s: float = 0.0
    # attacking direction of the home team in this period: +1 = towards +x, -1 = towards -x
    home_direction: int = 1


@dataclass(frozen=True)
class MatchSummary:
    id: int
    date_time: str
    home_team: str
    away_team: str
    home_team_id: int
    away_team_id: int


@dataclass
class MatchMeta:
    id: int
    competition: str
    season: str
    round_name: str | None
    date_time: str
    stadium: str | None
    home_score: int | None
    away_score: int | None
    home: Team
    away: Team
    surface: PlayingSurface
    periods: list[Period]
    players: list[Player] = field(default_factory=list)

    def team(self, side: str) -> Team:
        return self.home if side == "home" else self.away

    def period(self, number: int) -> Period:
        for p in self.periods:
            if p.period == number:
                return p
        raise KeyError(number)
