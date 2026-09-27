"""Local player density around the ball."""
from __future__ import annotations

import math

import numpy as np

from app.analytics.metrics.proximity import players_within


def local_density(points: np.ndarray, ball_xy: np.ndarray, radius: float, area_unit: float) -> float:
    """Players (of the given set) inside a disc of ``radius`` around the ball, per ``area_unit`` m².

    Returns NaN when the ball position is unknown.
    """
    if not np.all(np.isfinite(ball_xy)):
        return float("nan")
    disc_area = math.pi * radius**2
    return players_within(points, ball_xy, radius) / disc_area * area_unit
