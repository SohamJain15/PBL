from __future__ import annotations

import numpy as np
from sklearn.preprocessing import StandardScaler


class FeatureScaler:
    """Z-score standardisation; keeps the fitted statistics for interpretation."""

    def __init__(self) -> None:
        self._scaler = StandardScaler()

    def fit_transform(self, x: np.ndarray) -> np.ndarray:
        return self._scaler.fit_transform(x)

    @property
    def mean(self) -> np.ndarray:
        return self._scaler.mean_

    @property
    def scale(self) -> np.ndarray:
        return self._scaler.scale_
