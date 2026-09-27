# Frontend architecture

```
src/
├── app/                App shell, routes, providers
│   └── providers/      AppStateProvider (selection, overlays, analysis params)
│                       PlaybackProvider + playbackStore (clock outside React state)
├── pages/              MatchPage · PatternsPage · AnalysisPage (composition only)
├── features/           domain UI: match, tracking, patterns, analysis, heatmaps
├── components/         reusable: pitch/*, timeline/*, analysis/*, patterns/*, common/*
├── hooks/              useMatch, useTracking (chunk loader), usePlayback, usePatterns, useAsync
├── services/           typed API client with response cache + in-flight de-duplication
├── types/              mirrors of the backend Pydantic schemas
└── utils/              coordinates, interpolation, formatting, pattern styles, constants
```

## Rendering and performance

- The pitch (`FootballPitch`) is static SVG in metre coordinates and is memoised; only
  `TrackingScene` re-renders during playback.
- The playback clock lives in `PlaybackStore` and advances in a `requestAnimationFrame` loop.
  Components subscribe with `usePlaybackSelector` to exactly the slice they need. The metric
  strip and side panel subscribe to the *frame* (≤ 10 updates/s), not the 60 Hz clock.
- Tracking arrives in 30 s chunks. See `hooks/useTracking.ts`.
- Interpolation (`utils/interpolation.ts`) is linear between consecutive provider frames and is
  never applied across gaps > 0.15 s. It can be switched off; the transport shows `RAW` vs
  `INTERPOLATED`. Paused frames are always raw.
- Trajectories use raw provider positions only.

## Separation rule

The frontend performs no analytics. Team shape, hulls, centroids, player kinematics, heatmaps
and clusters all come from the API; the UI only looks values up by timestamp.
