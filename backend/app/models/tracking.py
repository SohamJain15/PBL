"""Columnar tracking representation used by all analytics code."""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from app.core.constants import FLAG_MISSING


@dataclass
class TrackingData:
    """Dense arrays for a whole match.

    N = frames, P = players that appear at least once.

    frame        (N,)     int32   provider frame number
    period       (N,)     int8    0 = no period
    t            (N,)     float32 match clock in seconds (period 2 starts at 2700 s)
    ball         (N, 3)   float32 NaN when missing
    ball_flag    (N,)     int8    -1 missing / 0 extrapolated / 1 detected
    possession   (N,)     int8    0 none / 1 home / 2 away
    possession_player (N,) int64  player id in possession, -1 if none
    xy           (N, P, 2) float32 NaN when the player is not in the frame
    flag         (N, P)   int8    -1 missing / 0 extrapolated / 1 detected
    player_ids   (P,)     int64
    """

    frame: np.ndarray
    period: np.ndarray
    t: np.ndarray
    ball: np.ndarray
    ball_flag: np.ndarray
    possession: np.ndarray
    possession_player: np.ndarray
    xy: np.ndarray
    flag: np.ndarray
    player_ids: np.ndarray

    ARRAY_FIELDS = (
        "frame", "period", "t", "ball", "ball_flag", "possession", "possession_player", "xy", "flag", "player_ids",
    )

    @property
    def n_frames(self) -> int:
        return int(self.frame.shape[0])

    def has_players(self) -> np.ndarray:
        """Boolean mask of frames that contain at least one player observation."""
        return (self.flag != FLAG_MISSING).any(axis=1)

    def period_indices(self, period: int) -> np.ndarray:
        return np.flatnonzero(self.period == period)

    def range_indices(self, period: int, start_s: float, end_s: float) -> np.ndarray:
        idx = self.period_indices(period)
        t = self.t[idx]
        return idx[(t >= start_s - 1e-6) & (t <= end_s + 1e-6)]

    def to_npz(self, path) -> None:  # type: ignore[no-untyped-def]
        np.savez_compressed(path, **{f: getattr(self, f) for f in self.ARRAY_FIELDS})

    @classmethod
    def from_npz(cls, path) -> "TrackingData":  # type: ignore[no-untyped-def]
        with np.load(path) as z:
            return cls(**{f: z[f] for f in cls.ARRAY_FIELDS})
