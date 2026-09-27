"""Planar geometry primitives (no external dependency, fully unit-tested)."""
from __future__ import annotations

import numpy as np


def convex_hull(points: np.ndarray) -> np.ndarray:
    """Andrew's monotone-chain convex hull. Returns vertices counter-clockwise, shape (H, 2).

    Collinear and duplicate points are dropped. Fewer than 3 unique points returns them unchanged.
    """
    pts = np.unique(np.asarray(points, dtype=float), axis=0)
    if pts.shape[0] < 3:
        return pts
    pts = pts[np.lexsort((pts[:, 1], pts[:, 0]))]

    def cross(o: np.ndarray, a: np.ndarray, b: np.ndarray) -> float:
        return float((a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]))

    lower: list[np.ndarray] = []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    upper: list[np.ndarray] = []
    for p in pts[::-1]:
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    return np.array(lower[:-1] + upper[:-1])


def polygon_area(vertices: np.ndarray) -> float:
    """Shoelace formula. Vertices must be ordered (as returned by :func:`convex_hull`)."""
    if vertices.shape[0] < 3:
        return 0.0
    x, y = vertices[:, 0], vertices[:, 1]
    return float(0.5 * abs(np.dot(x, np.roll(y, -1)) - np.dot(y, np.roll(x, -1))))


def centroid(points: np.ndarray) -> np.ndarray:
    return points.mean(axis=0)
