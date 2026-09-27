"""Overlapping temporal windows over a sampled series."""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class Window:
    period: int
    start: int  # inclusive sample index
    end: int  # exclusive sample index
    start_s: float
    end_s: float


def sliding_windows(t: np.ndarray, period: np.ndarray, window_s: float, step_s: float, sample_dt: float) -> list[Window]:
    """Windows of ``window_s`` every ``step_s`` inside each period.

    ``t`` must be sorted within a period. Windows never cross a period boundary; a window whose
    samples are not contiguous in time (broadcast gap) is dropped.
    """
    if window_s <= 0 or step_s <= 0:
        raise ValueError("window and step must be positive")
    n_win = int(round(window_s / sample_dt))
    n_step = max(1, int(round(step_s / sample_dt)))
    windows: list[Window] = []
    for p in np.unique(period[period > 0]):
        idx = np.flatnonzero(period == p)
        if idx.size < n_win:
            continue
        for s in range(0, idx.size - n_win + 1, n_step):
            a, b = idx[s], idx[s + n_win - 1]
            span = t[b] - t[a]
            if abs(span - (n_win - 1) * sample_dt) > sample_dt * 0.5:
                continue  # time gap inside the window
            windows.append(Window(int(p), int(a), int(b) + 1, float(t[a]), float(t[b] + sample_dt)))
    return windows
