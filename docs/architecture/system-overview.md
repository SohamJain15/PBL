# System overview

Tactical Lab is a monorepo with three layers that never import across the boundary in the wrong
direction:

```
data/raw  ──►  backend (Python)                                   ──►  frontend (React)
               loaders → preprocessing → analytics → ml → services → API    consumes typed JSON
```

| Layer | Location | Responsibility |
|---|---|---|
| Data | `backend/app/data` | Parse provider files into a source-agnostic `MatchMeta` + `TrackingData`; cache to `.npz` |
| Analytics | `backend/app/analytics` | Deterministic geometry and kinematics: width, depth, hull, compactness, proximity, density, windows |
| ML | `backend/app/ml` | Window representation → scaling → clustering → episodes → interpretation |
| Services | `backend/app/services` | Orchestration, caching, assembling API payloads, and goal impact analysis |
| API | `backend/app/api` | FastAPI routes, Pydantic schemas, error mapping |
| Frontend | `frontend/src` | Rendering, playback, interaction. No analytics. |

## Multisport seam

Only three abstractions exist, each where a second implementation is realistic:

- `models.sport.Sport` / `PlayingSurface` — the surface a match is played on.
- `data.loaders.base_loader.BaseTrackingLoader` — implemented by `SkillCornerFootballLoader`.
  A basketball or kabaddi tracker only needs to produce `MatchMeta` + `TrackingData`.
- `ml.clustering.base.BasePatternMiner` — implemented by `KMeansPatternMiner`.
  Sequence models, autoencoders or graph embeddings plug in here (or in
  `ml/representation`, which maps a window to a vector).

Football-specific logic is isolated in `FootballTeamShapeExtractor` and
`FootballPatternInterpreter`.

## Runtime

- Backend: FastAPI + uvicorn, single process, in-memory LRU for parsed matches.
- Frontend: Vite dev server proxies `/api` to the backend.
- `docker-compose.yml` runs both.

The Analysis page adds a goal impact review on top of the discovery workflow. It combines inferred
score transitions from dynamic events with a 15-second comparison of tracking-derived team metrics,
phase context, and any nearby discovered pattern. The output describes possible contributors; it
does not establish causation.
