# Backend architecture

```
app/
├── main.py                  FastAPI app, CORS, gzip, domain-error handler
├── api/
│   ├── dependencies.py      service singletons
│   └── routes/              matches · tracking · features · patterns · analysis · heatmaps
├── core/                    config (env TPM_*), constants, logging, exceptions
├── models/                  internal dataclasses (sport, match, tracking, feature, pattern)
├── schemas/                 Pydantic API contracts
├── data/
│   ├── loaders/             BaseTrackingLoader, SkillCornerFootballLoader
│   ├── preprocessing/       team masks & attack direction, tracking-quality accounting
│   └── repositories/        MatchRepository (metadata + npz cache + LRU)
├── analytics/
│   ├── metrics/             width, depth, compactness (stretch index), proximity
│   ├── spatial/             geometry (hull, area), team_shape, density, occupancy
│   └── temporal/            windows, sequences (episode merging), dynamics (kinematics)
├── ml/
│   ├── preprocessing/       FeatureScaler
│   ├── representation/      window → feature vector (CLUSTER_FEATURES)
│   ├── clustering/          BasePatternMiner, KMeansPatternMiner
│   ├── discovery/           PatternDiscovery pipeline
│   └── interpretation/      FootballPatternInterpreter (documented rules)
└── services/                match, tracking, feature, pattern, heatmap, goal analysis
└── utils/                   coordinates, time, validation
```

Goal analysis is evidence-based rather than causal: the provider dynamic-event file does not
contain a dedicated goal-cause label. The service compares pre-goal tracking metrics with the
team's match baseline and labels the result as possible weaknesses or attacking signals.

## Endpoints

| Method | Path | Returns |
|---|---|---|
| GET | `/api/matches` | index with metadata/tracking availability |
| GET | `/api/matches/{id}` | teams, kits, players, periods, pitch, whole-match quality |
| GET | `/api/matches/{id}/frames?period&start&end` | columnar frames (≤ 120 s) |
| GET | `/api/matches/{id}/features?period&start&end` | 10 Hz shape + hulls + player stats (≤ 900 s) |
| GET | `/api/matches/{id}/quality?period&start&end` | observation counts |
| GET | `/api/matches/{id}/window-summary?period&start&end` | mean + first/last-second values per metric |
| GET | `/api/matches/{id}/shape-timeline?period&bin` | binned shape for charts |
| GET | `/api/matches/{id}/heatmap?side&period&start&end&bin` | occupancy grid |
| GET | `/api/matches/{id}/patterns?window&step&k` | discovery summary |
| GET | `/api/matches/{id}/patterns/{cluster_id}` | cluster + its sequences |
| GET | `/api/matches/{id}/episodes/{episode_id}` | sequence detail + measured start→end changes |
| GET | `/api/matches/{id}/goals` | inferred goal events from dynamic-event score changes |
| GET | `/api/matches/{id}/goals/{goal_id}/analysis` | 15-second pre-goal weaknesses, attacking signals, phase, and pattern context |
| POST | `/api/analyze` | run discovery with custom window / step / k |

Interactive docs: `http://127.0.0.1:8000/docs`.

## Conventions

- Every threshold lives in `core/constants.py`.
- Domain errors derive from `TacticalLabError` and carry an HTTP status.
- Services are the only layer that knows about caching.
