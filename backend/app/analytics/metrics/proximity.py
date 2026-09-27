from __future__ import annotations

import numpy as np


def players_within(points: np.ndarray, ball_xy: np.ndarray, radius: float) -> int:
    """Number of players whose distance to the ball is <= radius. NaN ball -> 0."""
    if points.shape[0] == 0 or not np.all(np.isfinite(ball_xy)):
        return 0
    return int((np.linalg.norm(points - ball_xy, axis=1) <= radius).sum())
