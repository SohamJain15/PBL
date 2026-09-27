"""Sport abstraction. Only football is implemented; the enum/spec make other sports pluggable."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class Sport(str, Enum):
    FOOTBALL = "football"
    BASKETBALL = "basketball"
    CRICKET = "cricket"
    KABADDI = "kabaddi"


@dataclass(frozen=True)
class PlayingSurface:
    """Rectangular playing surface in metres, origin at the centre."""

    sport: Sport
    length: float
    width: float

    @property
    def half_diagonal(self) -> float:
        return float(((self.length / 2) ** 2 + (self.width / 2) ** 2) ** 0.5)
