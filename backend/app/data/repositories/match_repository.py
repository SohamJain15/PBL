"""Caching access layer over a loader: parsed metadata in memory, tracking as .npz on disk."""
from __future__ import annotations

import threading
from collections import OrderedDict
from dataclasses import replace

import numpy as np
import pandas as pd

from app.core.exceptions import MatchNotFoundError
from app.core.logging import get_logger
from app.data.loaders.skillcorner_loader import SkillCornerFootballLoader
from app.models.match import MatchMeta, MatchSummary
from app.models.tracking import TrackingData

log = get_logger(__name__)

TRACKING_CACHE_VERSION = "v2"
MAX_TRACKING_IN_MEMORY = 3


class MatchRepository:
    def __init__(self, loader: SkillCornerFootballLoader, processed_dir) -> None:  # type: ignore[no-untyped-def]
        self.loader = loader
        self.processed_dir = processed_dir
        self._meta: dict[int, MatchMeta] = {}
        self._tracking: OrderedDict[int, TrackingData] = OrderedDict()
        self._lock = threading.Lock()

    def list_matches(self) -> list[MatchSummary]:
        return self.loader.list_matches()

    def ensure_known(self, match_id: int) -> None:
        if match_id not in {m.id for m in self.list_matches()} and not self.loader.meta_available(match_id):
            raise MatchNotFoundError(match_id)

    def tracking_available(self, match_id: int) -> bool:
        return self._npz_path(match_id).exists() or self.loader.tracking_available(match_id)

    def meta_available(self, match_id: int) -> bool:
        return self.loader.meta_available(match_id)

    def get_meta(self, match_id: int) -> MatchMeta:
        if match_id not in self._meta:
            self.ensure_known(match_id)
            meta = self.loader.load_meta(match_id)
            if self.tracking_available(match_id):
                meta = self._with_period_clock(meta, self.get_tracking(match_id, meta))
            self._meta[match_id] = meta
        return self._meta[match_id]

    def get_tracking(self, match_id: int, meta: MatchMeta | None = None) -> TrackingData:
        with self._lock:
            if match_id in self._tracking:
                self._tracking.move_to_end(match_id)
                return self._tracking[match_id]
            path = self._npz_path(match_id)
            if path.exists():
                data = TrackingData.from_npz(path)
            else:
                meta = meta or self.loader.load_meta(match_id)
                log.info("Parsing raw tracking for match %s (first run only)", match_id)
                data = self.loader.load_tracking(match_id, meta)
                path.parent.mkdir(parents=True, exist_ok=True)
                data.to_npz(path)
            self._tracking[match_id] = data
            while len(self._tracking) > MAX_TRACKING_IN_MEMORY:
                self._tracking.popitem(last=False)
            return data

    def get_phases(self, match_id: int) -> pd.DataFrame | None:
        return self.loader.load_phases(match_id)

    def _npz_path(self, match_id: int):  # type: ignore[no-untyped-def]
        return self.processed_dir / f"{match_id}_tracking_{TRACKING_CACHE_VERSION}.npz"

    @staticmethod
    def _with_period_clock(meta: MatchMeta, tracking: TrackingData) -> MatchMeta:
        periods = []
        for p in meta.periods:
            idx = tracking.period_indices(p.period)
            t = tracking.t[idx]
            t = t[~np.isnan(t)]
            if t.size:
                p = replace(p, start_s=float(t.min()), end_s=float(t.max()))
            periods.append(p)
        meta.periods = periods
        return meta
