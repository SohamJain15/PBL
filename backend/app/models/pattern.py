"""Pattern-discovery result containers."""
from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
import pandas as pd


@dataclass
class Episode:
    id: int
    cluster_id: int
    side: str
    period: int
    start_s: float
    end_s: float
    n_windows: int
    distance_to_centroid: float

    @property
    def duration_s(self) -> float:
        return self.end_s - self.start_s


@dataclass
class Interpretation:
    label: str | None  # None = no rule matched
    rules_matched: list[str] = field(default_factory=list)
    evidence: dict[str, float] = field(default_factory=dict)


@dataclass
class DiscoveryResult:
    match_id: int
    window_s: float
    step_s: float
    feature_columns: list[str]
    windows: pd.DataFrame  # window table with features + cluster + pca
    k: int
    k_scores: dict[int, float]
    cluster_centers_z: np.ndarray  # (k, F) in standardised space
    pca_explained: list[float]
    episodes: list[Episode]
    interpretations: dict[int, Interpretation]
    phase_agreement: dict[str, object] | None
    runtime_s: float
