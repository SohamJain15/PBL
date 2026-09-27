# Evaluation

Numbers below are from match **1886347** (Auckland FC 2–0 Newcastle Jets), window 5 s, step 1 s,
produced by `python scripts/run_pattern_discovery.py --json`
(`experiments/results/1886347_discovery_5.0s_1.0s.json`).

## Internal validity

| k | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|
| silhouette (sample 4000) | 0.135 | 0.140 | 0.144 | 0.154 | 0.157 | 0.161 |

- Silhouette is low and increases slowly up to the upper bound of the candidate range. The
  window space is a **continuum**, not a set of well-separated tactical states. k = 8 is chosen
  because it is the top of the searched range, not because a clear optimum exists.
- PCA: PC1 27.3%, PC2 18.5% of variance — the 2-D embedding is a partial view.

## Discovered clusters

| Cluster | Sequences | Windows | Avg dur. | Interpretation |
|---|---|---|---|---|
| C01 | 137 | 602 | 8.4 s | — |
| C02 | 355 | 1605 | 8.5 s | — |
| C03 | 169 | 1244 | 11.4 s | — |
| C04 | 235 | 957 | 8.1 s | Defensive Shift |
| C05 | 109 | 445 | 8.1 s | — |
| C06 | 283 | 1066 | 7.8 s | Defensive Compression |
| C07 | 175 | 717 | 8.1 s | Wing Expansion |
| C08 | 280 | 1542 | 9.5 s | Local Overload |

## External reference

Agreement with SkillCorner phases of play (6,194 windows with a phase at their midpoint):
**NMI 0.223, ARI 0.143**. The clusters carry some phase information (mostly the
in/out-of-possession split and set plays) but are clearly not a re-labelling of the provider's
phases, which is expected: phases describe game context, clusters describe shape *dynamics*.

## What would make this stronger

- Repeat across all 20 matches and report stability (ARI between runs / matches).
- Hold-out matches: fit on N−k matches, assign the rest, compare profiles.
- Analyst annotation of a sample of sequences per cluster (precision of interpretations).
- Compare against sequence-aware representations (DTW, autoencoders).
