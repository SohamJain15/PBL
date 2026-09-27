from __future__ import annotations

import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

from app.core.constants import K_CANDIDATES, KMEANS_N_INIT, RANDOM_STATE, SILHOUETTE_SAMPLE_SIZE
from app.ml.clustering.base import BasePatternMiner, ClusteringOutput


class KMeansPatternMiner(BasePatternMiner):
    """K-Means with k chosen by (sampled) silhouette score unless ``k`` is fixed."""

    def __init__(self, k: int | None = None, candidates: tuple[int, ...] = K_CANDIDATES) -> None:
        self.k = k
        self.candidates = candidates

    def _fit_k(self, x: np.ndarray, k: int) -> KMeans:
        return KMeans(n_clusters=k, n_init=KMEANS_N_INIT, random_state=RANDOM_STATE).fit(x)

    def fit(self, x: np.ndarray) -> ClusteringOutput:
        if x.shape[0] < max(self.candidates) + 1:
            raise ValueError("Not enough windows to cluster")
        scores: dict[int, float] = {}
        models: dict[int, KMeans] = {}
        candidates = (self.k,) if self.k else self.candidates
        sample = min(SILHOUETTE_SAMPLE_SIZE, x.shape[0])
        for k in candidates:
            model = self._fit_k(x, k)
            models[k] = model
            scores[k] = float(silhouette_score(x, model.labels_, sample_size=sample, random_state=RANDOM_STATE))
        best = max(scores, key=lambda k: scores[k])
        model = models[best]
        return ClusteringOutput(
            labels=model.labels_.astype(int),
            centers=model.cluster_centers_,
            k=best,
            selection_scores=scores,
            method="kmeans",
        )
