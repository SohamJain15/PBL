from __future__ import annotations

import numpy as np


def team_depth(points: np.ndarray) -> float:
    """Longitudinal extent (m): max(x) - min(x) of the given (outfield) player positions."""
    if points.shape[0] < 2:
        return float("nan")
    return float(points[:, 0].max() - points[:, 0].min())
