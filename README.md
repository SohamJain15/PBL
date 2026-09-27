# Tactical Lab

**AI-Powered Spatiotemporal Tactical Pattern Mining for Multisport Analytics** — research prototype, Demo 1 (football).

Real broadcast tracking → team-shape representation → overlapping temporal windows → unsupervised
pattern discovery → rule-based tactical interpretation → interactive replay.

> This is an early research prototype. It demonstrates spatiotemporal representation,
> unsupervised pattern discovery and interpretable visualisation. It does **not** provide
> validated tactical classification, performance prediction or coaching recommendations.

---

## 1. Project

A workspace with three views:

| View | What it does |
|---|---|
| **Match** | 104 × 68 m pitch rendered from metadata; real 10 fps tracking replay (play / pause / frame step / 0.5–2×); hull, centroid and trajectory overlays; live team shape; drag on the timeline to analyse any time window; pattern timeline with one lane per discovered cluster; tactical replay (before → during → after); tracking-quality breakdown; demo sequence |
| **Patterns** | Cluster table, PCA embedding (click a point to replay it), feature profiles, interpretation rules, representative sequences, agreement with SkillCorner phases of play |
| **Analysis** | Team shape over time, occupancy heatmap (team / period / selected window), pattern frequency, pattern distribution over the match |

## 2. Research problem

Tactical behaviour is how a team's collective shape evolves over a few seconds. The question for
this milestone: can recurring collective-movement patterns be discovered from broadcast-derived
tracking **without labels**, and presented so an analyst can inspect and judge them?
See [`docs/research/problem-statement.md`](docs/research/problem-statement.md).

## 3. Dataset

[SkillCorner Open Data](https://github.com/SkillCorner/opendata): Australian A-League 2024/25,
20 matches, broadcast tracking at 10 fps, plus match metadata, phases of play and dynamic events.

The repository ships metadata for all 20 matches and full tracking for **match 1886347**
(Auckland FC 2–0 Newcastle Jets, Round 6, 30 Nov 2024). Other matches:
`python scripts/download_data.py --match <id>`.

Observed schema: [`docs/dataset/data-schema.md`](docs/dataset/data-schema.md).

## 4. Architecture

```
tactical-pattern-mining/
├── backend/app/
│   ├── data/          loaders (BaseTrackingLoader → SkillCornerFootballLoader), preprocessing, repository + cache
│   ├── analytics/     metrics (width, depth, compactness, proximity), spatial (hull, shape, density, occupancy),
│   │                  temporal (windows, episodes, kinematics)
│   ├── ml/            representation → scaler → clustering (BasePatternMiner → KMeans) → discovery → interpretation
│   ├── services/      orchestration + caching
│   ├── api/           FastAPI routes;  schemas/ Pydantic contracts;  models/ internal dataclasses
│   └── core/          config (TPM_* env vars), constants (every threshold), logging, exceptions
├── frontend/src/
│   ├── app/           shell, routes, providers (app state, playback clock)
│   ├── pages/         Match · Patterns · Analysis
│   ├── features/      match, tracking, patterns, analysis, heatmaps
│   ├── components/    pitch, timeline, analysis, patterns, common
│   └── hooks/ services/ types/ utils/
├── scripts/           download · inspect · preprocess · extract features · run discovery
├── docs/              architecture/, research/, dataset/
├── data/              raw/skillcorner, processed/, features/, cache/
└── experiments/       notebooks/, results/
```

The frontend performs no analytics; every number it shows comes from the API.
Details: [`docs/architecture/`](docs/architecture/system-overview.md).

## 5. Data pipeline

```
raw JSONL (10 Hz) → loader → dense arrays + detection flags (.npz cache)
  → direction normalisation (team attacks +x) → frame-level team shape (5 Hz / 10 Hz)
  → overlapping windows (5 s / 1 s, configurable) → 13-d window vectors
  → z-score → K-Means (k by silhouette) → episodes → interpretation → API → UI
```

Playback requests only 30 s chunks (≈60 KB gzipped); the browser never holds a full match.

## 6. Feature engineering

Per team, outfield players only: width, depth, convex-hull area, centroid, stretch index,
compactness `C = 1 − S/R` (S = mean distance to centroid, R = half pitch diagonal), players
within 10 / 20 m of the ball, ball-area density, ball–centroid distance. Per window: changes in
width / depth / area / compactness, lateral and forward centroid shift, centroid speed,
means of the state metrics, possession share. Player level: distance, speed, acceleration,
heading. Definitions: [`docs/research/feature-engineering.md`](docs/research/feature-engineering.md).

## 7. Pattern discovery

StandardScaler → K-Means with k ∈ {3…8} chosen by silhouette; PCA for the 2-D view only.
Consecutive windows with the same team and cluster merge into *sequences* (episodes), which is
what counts and durations refer to. Why K-Means and not DBSCAN for the baseline, and how to swap
it: [`docs/research/pattern-mining.md`](docs/research/pattern-mining.md).

On match 1886347 (5 s / 1 s): 8,178 team-windows, k = 8, silhouette 0.161, 1,743 sequences;
NMI 0.223 with SkillCorner phases of play. Full numbers:
[`docs/research/evaluation.md`](docs/research/evaluation.md).

## 8. Tactical interpretation

Clusters are *model-discovered patterns*. A separate, documented rule layer reads each cluster's
mean z-scores and possession share and may attach a *tactical interpretation*: Defensive
Compression, Defensive Shift, Wing Expansion, Local Overload. Clusters that match no rule stay
unlabelled. The UI always shows the two separately.

## 9. Installation

Requirements: Python ≥ 3.10, Node ≥ 18.

```bash
# backend
cd backend
python -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cd ..

# frontend
cd frontend
npm install
cd ..

# data: metadata for all matches is included; tracking for match 1886347 must be fetched once (~90 MB)
python scripts/download_data.py --match 1886347
```

## 10. Running

Two terminals from the repository root:

```bash
# terminal 1 — API on http://127.0.0.1:8000  (docs at /docs)
cd backend && uvicorn app.main:app --reload --port 8000

# terminal 2 — UI on http://localhost:5173
cd frontend && npm run dev
```

The first request for a match parses the raw tracking (~3 s) and extracts team shape (~11 s);
results are cached in `data/processed`, `data/features` and `data/cache`.

Optional:

```bash
python scripts/preprocess_data.py                       # parse + cache all downloaded matches
python scripts/run_pattern_discovery.py --json          # print / save the discovery summary
python scripts/extract_features.py --csv                # export the window feature table
cd backend && pytest                                    # 33 unit + integration tests
docker compose up --build                               # both services in containers
```

Keyboard: `space` play / pause, `←` / `→` frame step, `shift` + arrow = 1 s.

**Demo (2–3 minutes):** open Match → *Demo sequence*. The app jumps to the automatically
selected real sequence, plays before → during → after with hull and centroid, the panel shows
the discovered cluster, the measured start → end changes and the interpretation. Then open
Patterns (embedding + clusters) and Analysis (shape over time, heatmap).

## 11. Dataset attribution

This project uses **SkillCorner Open Data** — https://github.com/SkillCorner/opendata —
© SkillCorner, released under the MIT License. All tracking, event and phase data belong to
SkillCorner. Please credit SkillCorner when using or presenting results from this project.

## 12. Current limitations

Broadcast tracking (≈41% of player observations extrapolated, ≈26% of in-period frames empty);
weak cluster separation (clusters partition a continuum); per-match fitting; hand-set rule
thresholds; one match bundled with tracking. See [`docs/research/limitations.md`](docs/research/limitations.md).

## 13. Future research

- Cross-match discovery and stability analysis over all 20 matches
- Learned sequence representations (autoencoders, temporal transformers, graph networks)
- Tactical similarity search and pattern retrieval
- Player-role and team comparison, pattern evolution within and across matches
- Analyst-annotated evaluation of interpretations
- Other sports (basketball, cricket, kabaddi) via new loaders and interpreters
- Video input: detection, re-identification and pitch calibration to produce tracking
