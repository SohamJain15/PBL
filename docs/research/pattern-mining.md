# Pattern mining

## Why K-Means as the baseline

- Features are few (13), continuous, standardised and roughly unimodal, which suits a
  centroid model.
- Centroids are directly interpretable as *mean feature profiles*, which the interpretation
  layer reads.
- It is deterministic given `random_state`, fast (≈ 3 s for 8k windows including k-selection)
  and easy to replace.

DBSCAN / HDBSCAN were not chosen for the baseline: overlapping 1 s-step windows form a dense,
continuous cloud (silhouette ≈ 0.13–0.16, see `evaluation.md`), so density-based methods tend
to return one giant component plus noise unless heavily tuned. They remain good candidates
behind `BasePatternMiner`.

## Model-discovered pattern vs tactical interpretation

The UI always separates:

- **Model-discovered pattern** — cluster id, number of windows / sequences, average duration,
  feature profile (z-scores). This is what K-Means produced.
- **Tactical interpretation** — a label produced by explicit rules applied to that profile.
  K-Means knows nothing about football.

## Interpretation rules (`ml/interpretation/tactical_interpreter.py`)

Evaluated in order; the first match is the label, all matches are reported.

| Label | Rule on cluster means |
|---|---|
| Defensive Compression | possession share ≤ 0.4 **and** z(width Δ) ≤ −0.5 **and** z(area Δ) ≤ −0.5 |
| Defensive Shift | possession share ≤ 0.4 **and** z(lateral shift) ≥ 0.5 **and** \|z(area Δ)\| < 0.5 |
| Wing Expansion | possession share ≥ 0.6 **and** z(width Δ) ≥ 0.5 **and** z(area Δ) ≥ 0.5 |
| Local Overload | z(players ≤ 10 m) ≥ 0.75 **or** z(ball-area density) ≥ 0.75 |

Clusters that match no rule are shown as *Unlabelled*. That is expected and honest: several
clusters describe states (e.g. settled possession, stable block) that the four initial concepts
do not cover.

## Demo sequence selection

Deterministic: among interpreted clusters, pick the one with the largest |z(width Δ)| + |z(area Δ)|,
then its representative sequence (smallest mean distance to the centroid among sequences of ≥ 3
windows). For match 1886347 at 5 s / 1 s this is sequence #1070: Newcastle, 53:02–53:10,
cluster C07 (Wing Expansion).
