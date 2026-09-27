"""Tracking-quality accounting. Broadcast tracking contains extrapolated and missing observations."""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from app.core.constants import FLAG_DETECTED, FLAG_EXTRAPOLATED
from app.models.tracking import TrackingData


@dataclass(frozen=True)
class QualitySummary:
    frames: int
    frames_with_players: int
    detected: int
    extrapolated: int
    missing: int  # expected player-slots (22 per frame) with no observation, incl. empty frames
    ball_detected: int
    ball_extrapolated: int
    ball_missing: int


def quality_summary(tracking: TrackingData, indices: np.ndarray, players_per_frame: int = 22) -> QualitySummary:
    flags = tracking.flag[indices]
    has_players = (flags >= 0).any(axis=1)
    detected = int((flags == FLAG_DETECTED).sum())
    extrapolated = int((flags == FLAG_EXTRAPOLATED).sum())
    expected = int(indices.size) * players_per_frame
    ball = tracking.ball_flag[indices]
    return QualitySummary(
        frames=int(indices.size),
        frames_with_players=int(has_players.sum()),
        detected=detected,
        extrapolated=extrapolated,
        missing=max(0, expected - detected - extrapolated),
        ball_detected=int((ball == FLAG_DETECTED).sum()),
        ball_extrapolated=int((ball == FLAG_EXTRAPOLATED).sum()),
        ball_missing=int((ball < 0).sum()),
    )
