# ML architecture

```
5 Hz shape series (per team)
   └─ sliding_windows(window_s, step_s)          analytics/temporal/windows.py
        └─ window_row → 13-d vector              ml/representation/sequence_features.py
             └─ FeatureScaler (z-score)          ml/preprocessing/scaler.py
                  └─ BasePatternMiner.fit        ml/clustering/{base,kmeans}.py
                       ├─ PCA (display only)
                       ├─ merge_runs → episodes  analytics/temporal/sequences.py
                       └─ FootballPatternInterpreter
```

## Replacing the model

- **New representation** (autoencoder, transformer, GNN): produce a matrix aligned with the
  window table and call `PatternDiscovery.run` with a miner that accepts it; or replace
  `build_window_table`.
- **New clustering** (HDBSCAN, GMM, spectral): implement `BasePatternMiner.fit` returning
  `ClusteringOutput(labels, centers, k, selection_scores)`.
- **New sport**: implement a loader and a sport-specific interpreter rule set.

The API contract (`DiscoverySummary`) does not change when any of these are swapped.
