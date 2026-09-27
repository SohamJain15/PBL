"""Spatial occupancy (heatmap) from raw player positions."""
from __future__ import annotations

import numpy as np


def occupancy_grid(
    positions: np.ndarray, length: float, width: float, bin_m: float, smooth_sigma_bins: float
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """2-D histogram of positions (M, 2) on a pitch centred at the origin.

    Returns (grid [ny, nx] normalised to sum 1, x_edges, y_edges). Smoothing is a separable Gaussian
    applied to the counts (visual continuity only; set sigma to 0 to disable).
    """
    nx, ny = int(np.ceil(length / bin_m)), int(np.ceil(width / bin_m))
    x_edges = np.linspace(-length / 2, length / 2, nx + 1)
    y_edges = np.linspace(-width / 2, width / 2, ny + 1)
    pts = positions[np.all(np.isfinite(positions), axis=1)]
    counts, _, _ = np.histogram2d(pts[:, 1], pts[:, 0], bins=[y_edges, x_edges]) if pts.size else (
        np.zeros((ny, nx)), None, None
    )
    if smooth_sigma_bins > 0:
        counts = gaussian_smooth(counts, smooth_sigma_bins)
    total = counts.sum()
    return (counts / total if total > 0 else counts), x_edges, y_edges


def gaussian_smooth(grid: np.ndarray, sigma: float) -> np.ndarray:
    radius = max(1, int(round(3 * sigma)))
    k = np.exp(-0.5 * (np.arange(-radius, radius + 1) / sigma) ** 2)
    k /= k.sum()
    out = np.apply_along_axis(lambda r: np.convolve(r, k, mode="same"), 1, grid)
    return np.apply_along_axis(lambda c: np.convolve(c, k, mode="same"), 0, out)
