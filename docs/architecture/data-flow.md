# Data flow

```
{id}_tracking_extrapolated.jsonl  (10 Hz, ~59k lines, ~90 MB)
        │  SkillCornerFootballLoader.load_tracking
        ▼
TrackingData (dense arrays)  ──cache──►  data/processed/{id}_tracking_v2.npz   (~2.5 s reload)
        │
        ├─► /frames          time-windowed columnar frames (≤120 s per request, gzip)
        ├─► /features        10 Hz team shape + hull polygons + player kinematics for a chunk
        ├─► /quality         detected / extrapolated / missing counts for a range
        ├─► /heatmap         occupancy grid (cached per parameters)
        │
        ▼  FeatureService.match_series  (5 Hz, both teams)
Shape series  ──cache──►  data/features/{id}_shape_5hz_v1.pkl
        │
        ▼  sliding_windows + build_window_table
Window table  (one row per team × window)
        │
        ▼  PatternDiscovery (scale → K-Means → PCA → episodes → interpretation)
DiscoveryResult  ──cache──►  data/cache/discovery_{id}_{hash}.pkl
        │
        └─► /patterns, /patterns/{cluster}, /episodes/{id}, POST /analyze
```

## Browser budget

The browser never receives a whole match. Playback loads 30 s chunks (~60 KB
gzipped for frames + shape together), keeps the current and previous chunk, and prefetches the next one 8 s before it is
needed.

## Caches

| Cache | Key | Invalidation |
|---|---|---|
| `.npz` tracking | match id + `TRACKING_CACHE_VERSION` | bump the version constant |
| 5 Hz shape series | match id + `SERIES_CACHE_VERSION` | bump the version constant |
| Discovery result | match, window, step, k, feature list, rule catalogue | automatic (hash) |
| API responses (frontend) | request URL | page reload |

Delete `data/processed`, `data/features` and `data/cache` to recompute everything.
