"""Dispersion-based compactness.

stretch index  S = mean_i || p_i - c ||            (metres; c = team centroid)
compactness    C = 1 - S / R,   R = half pitch diagonal

R is the largest distance any point on the pitch can be from the pitch centre, so C lies in [0, 1]
for any configuration on the pitch; higher C = players closer to their own centroid.
C is a monotone transform of S — it adds no information, only a bounded, comparable scale.
"""
from __future__ import annotations

import numpy as np


def stretch_index(points: np.ndarray) -> float:
    if points.shape[0] < 2:
        return float("nan")
    c = points.mean(axis=0)
    return float(np.linalg.norm(points - c, axis=1).mean())


def compactness_index(stretch: float, half_diagonal: float) -> float:
    if not np.isfinite(stretch) or half_diagonal <= 0:
        return float("nan")
    return float(np.clip(1.0 - stretch / half_diagonal, 0.0, 1.0))
