"""Provider-agnostic loader interface.

Adding a new data source (another football provider, basketball tracking, a video-derived tracker)
means implementing this interface; everything downstream consumes ``MatchMeta`` / ``TrackingData``.
"""
from __future__ import annotations

from abc import ABC, abstractmethod

from app.models.match import MatchMeta, MatchSummary
from app.models.sport import Sport
from app.models.tracking import TrackingData


class BaseTrackingLoader(ABC):
    sport: Sport

    @abstractmethod
    def list_matches(self) -> list[MatchSummary]: ...

    @abstractmethod
    def load_meta(self, match_id: int) -> MatchMeta: ...

    @abstractmethod
    def tracking_available(self, match_id: int) -> bool: ...

    @abstractmethod
    def load_tracking(self, match_id: int, meta: MatchMeta) -> TrackingData: ...
