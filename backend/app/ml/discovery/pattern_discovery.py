"""End-to-end unsupervised discovery: windows → vectors → scale → cluster → episodes → interpretation."""
from __future__ import annotations

import time

import numpy as np
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.metrics import adjusted_rand_score, normalized_mutual_info_score

from app.analytics.temporal.sequences import merge_runs
from app.core.constants import PCA_COMPONENTS, RANDOM_STATE
from app.ml.clustering.base import BasePatternMiner
from app.ml.interpretation.tactical_interpreter import FootballPatternInterpreter
from app.ml.preprocessing.scaler import FeatureScaler
from app.ml.representation.sequence_features import CLUSTER_FEATURES
from app.models.pattern import DiscoveryResult, Episode


class PatternDiscovery:
    def __init__(self, miner: BasePatternMiner, interpreter: FootballPatternInterpreter) -> None:
        self.miner = miner
        self.interpreter = interpreter

    def run(
        self,
        match_id: int,
        table: pd.DataFrame,
        window_s: float,
        step_s: float,
        reference_labels: pd.Series | None = None,
    ) -> DiscoveryResult:
        t0 = time.perf_counter()
        x_raw = table[CLUSTER_FEATURES].to_numpy(dtype=float)
        scaler = FeatureScaler()
        x = scaler.fit_transform(x_raw)

        out = self.miner.fit(x)
        table = table.copy()
        table["cluster"] = out.labels
        table["dist_to_center"] = np.linalg.norm(x - out.centers[out.labels], axis=1)

        pca = PCA(n_components=PCA_COMPONENTS, random_state=RANDOM_STATE).fit(x)
        emb = pca.transform(x)
        table["pc1"], table["pc2"] = emb[:, 0], emb[:, 1]

        episodes = self._episodes(table, step_s)
        interpretations = {}
        for c in range(out.k):
            profile = dict(zip(CLUSTER_FEATURES, out.centers[c].tolist()))
            profile["possession_share_raw"] = float(table.loc[table.cluster == c, "possession_share"].mean())
            interpretations[c] = self.interpreter.interpret(profile)

        agreement = None
        if reference_labels is not None:
            table["reference_label"] = reference_labels.values
            agreement = self._agreement(table)

        return DiscoveryResult(
            match_id=match_id,
            window_s=window_s,
            step_s=step_s,
            feature_columns=list(CLUSTER_FEATURES),
            windows=table,
            k=out.k,
            k_scores=out.selection_scores,
            cluster_centers_z=out.centers,
            pca_explained=[float(v) for v in pca.explained_variance_ratio_],
            episodes=episodes,
            interpretations=interpretations,
            phase_agreement=agreement,
            runtime_s=time.perf_counter() - t0,
        )

    @staticmethod
    def _episodes(table: pd.DataFrame, step_s: float) -> list[Episode]:
        runs = merge_runs(table, step_s)
        runs.sort(key=lambda r: (r.period, r.start_s, r.side))
        return [
            Episode(
                id=i,
                cluster_id=r.cluster,
                side=r.side,
                period=r.period,
                start_s=r.start_s,
                end_s=r.end_s,
                n_windows=len(r.row_indices),
                distance_to_centroid=float(table.loc[r.row_indices, "dist_to_center"].mean()),
            )
            for i, r in enumerate(runs)
        ]

    @staticmethod
    def _agreement(table: pd.DataFrame) -> dict[str, object]:
        labelled = table.dropna(subset=["reference_label"])
        if labelled.empty:
            return {"n_windows": 0}
        contingency = pd.crosstab(labelled.cluster, labelled.reference_label)
        return {
            "n_windows": int(len(labelled)),
            "nmi": float(normalized_mutual_info_score(labelled.reference_label, labelled.cluster)),
            "ari": float(adjusted_rand_score(labelled.reference_label, labelled.cluster)),
            "labels": [str(c) for c in contingency.columns],
            "clusters": [int(i) for i in contingency.index],
            "counts": contingency.to_numpy().astype(int).tolist(),
        }
