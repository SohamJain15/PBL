from __future__ import annotations

import numpy as np


def team_width(points: np.ndarray) -> float:
    """Lateral extent (m): max(y) - min(y) of the given (outfield) player positions."""
    if points.shape[0] < 2:
        return float("nan")
    return float(points[:, 1].max() - points[:, 1].min())
