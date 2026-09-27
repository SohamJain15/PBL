"""Coordinate conventions.

SkillCorner: metres, origin at the centre spot, x along the pitch length, y across it.
Normalised frame: the analysed team always attacks towards +x. Normalisation is a 180° rotation
(x, y) -> (-x, -y) so that left/right handedness is preserved.
"""
from __future__ import annotations

import numpy as np


def direction_from_side(side: str) -> int:
    """Map a provider attacking-side string to +1 (towards +x) or -1."""
    if side == "left_to_right":
        return 1
    if side == "right_to_left":
        return -1
    raise ValueError(f"Unknown attacking side '{side}'")


def normalise_xy(xy: np.ndarray, direction: int) -> np.ndarray:
    """Rotate positions so the team attacks towards +x. Works on any (..., 2) array."""
    return xy if direction == 1 else -xy
