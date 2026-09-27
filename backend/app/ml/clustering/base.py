"""Pattern-miner interface. Replace K-Means with any model that assigns windows to groups."""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field

import numpy as np


@dataclass
class ClusteringOutput:
    labels: np.ndarray
    centers: np.ndarray  # (k, F) in the space the model was fitted on
    k: int
    selection_scores: dict[int, float] = field(default_factory=dict)
    method: str = ""


class BasePatternMiner(ABC):
    @abstractmethod
    def fit(self, x: np.ndarray) -> ClusteringOutput: ...
