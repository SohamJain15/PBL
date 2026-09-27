"""Containers for engineered features."""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd


@dataclass
class ShapeSeries:
    """Per-sample team-shape metrics for one team (arrays aligned with ``t``)."""

    side: str
    t: np.ndarray
    frame_index: np.ndarray
    width: np.ndarray
    depth: np.ndarray
    area: np.ndarray
    stretch: np.ndarray
    compactness: np.ndarray
    centroid_x: np.ndarray  # normalised: team attacks towards +x
    centroid_y: np.ndarray  # normalised with the same rotation
    ball_centroid_dist: np.ndarray
    near_ball_10: np.ndarray
    near_ball_20: np.ndarray
    density: np.ndarray
    in_possession: np.ndarray  # bool
    valid: np.ndarray  # bool

    def as_frame(self) -> pd.DataFrame:
        return pd.DataFrame({k: v for k, v in self.__dict__.items() if isinstance(v, np.ndarray)})


# Columns of the per-window feature table (one row per team-window).
WINDOW_ID_COLUMNS = ["window_id", "side", "period", "start_s", "end_s", "start_index", "end_index"]
