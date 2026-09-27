"""Turn per-window cluster labels into contiguous episodes."""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd


@dataclass(frozen=True)
class Run:
    side: str
    period: int
    cluster: int
    row_indices: list[int]
    start_s: float
    end_s: float


def merge_runs(windows: pd.DataFrame, step_s: float) -> list[Run]:
    """Consecutive windows (same team, period, cluster; starts ``step_s`` apart) form one run.

    Expects columns: side, period, start_s, end_s, cluster. The frame index is used as row id.
    """
    runs: list[Run] = []
    tol = step_s * 0.5
    for (side, period), grp in windows.sort_values("start_s").groupby(["side", "period"], sort=False):
        current: list[int] = []
        prev_start, prev_cluster = np.nan, None
        for row_id, row in grp.iterrows():
            contiguous = prev_cluster == row.cluster and abs(row.start_s - prev_start - step_s) <= tol
            if not contiguous and current:
                runs.append(_make_run(windows, current, str(side), int(period)))
                current = []
            current.append(int(row_id))
            prev_start, prev_cluster = row.start_s, row.cluster
        if current:
            runs.append(_make_run(windows, current, str(side), int(period)))
    return runs


def _make_run(windows: pd.DataFrame, rows: list[int], side: str, period: int) -> Run:
    sub = windows.loc[rows]
    return Run(side, period, int(sub.cluster.iloc[0]), rows, float(sub.start_s.min()), float(sub.end_s.max()))
