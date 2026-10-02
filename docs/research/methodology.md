# Methodology

1. **Parse** SkillCorner tracking (10 Hz) into dense arrays; keep the provider's
   `is_detected` flag per observation (detected / extrapolated / missing).
2. **Normalise** direction: for each team and period, rotate positions 180° when needed so the
   team attacks towards +x (`home_team_side` from match metadata). Width, depth, area and
   distances are rotation-invariant; only centroid x/y and the heatmap use the rotation.
3. **Frame-level shape** at 5 Hz for each team's outfield players (GK excluded via provider
   role `GK`); a frame needs ≥ 8 outfield players to be valid.
4. **Windows**: overlapping windows (default 5 s, step 1 s) inside a period; a window is dropped
   if it spans a time gap or fewer than 90% of its samples have a valid team shape.
5. **Representation**: each (team, window) becomes a 13-dimensional vector
   (see `feature-engineering.md`). Windows where the ball is never located are dropped
   (ball-relative features undefined).
6. **Discovery**: z-score standardisation → K-Means, k ∈ {3…8} selected by sampled silhouette.
   PCA (2 components) is fitted on the same standardised matrix for visualisation only.
7. **Episodes**: consecutive windows of the same team, period and cluster (starts exactly one
   step apart) are merged into an episode. Episode counts and durations are what the UI calls
   *sequences / occurrences*.
8. **Interpretation**: documented rules on the cluster-mean z-scores and raw possession share
   (see `pattern-mining.md`).
9. **Reference comparison**: each window is matched to the SkillCorner *phase of play* at its
   midpoint to measure agreement (NMI / ARI). Phases are never used as input.
10. **Goal analysis**: dynamic-event score-state transitions are converted into goal records.
   For each goal, the system evaluates a 15-second pre-goal window against the selected team's
   match baseline. It ranks possible weakness signals for the conceding team and attacking
   signals for the scoring team using metric z-scores, then attaches the phase and any pattern
   episode active at the goal timestamp.

Everything is recomputed from the raw files; nothing in the UI is hardcoded.
