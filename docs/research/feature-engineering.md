# Feature engineering

All metrics use outfield players of one team (goalkeepers excluded) unless stated.

## Frame-level (5 Hz for windows, 10 Hz for playback)

| Metric | Definition | Unit |
|---|---|---|
| Width | max(y) − min(y) | m |
| Depth | max(x) − min(x) | m |
| Area | convex hull area (Andrew monotone chain + shoelace) | m² |
| Centroid | mean position; stored raw and direction-normalised | m |
| Stretch index S | mean distance of players to the centroid | m |
| Compactness C | 1 − S / R, R = half the pitch diagonal (≈ 61.8 m for 104 × 68) | 0–1 |
| Players ≤ 10 m / ≤ 20 m of ball | count of the team's players within the radius | – |
| Ball-area density | all players (both teams) within 10 m of the ball ÷ (π·10²) × 100 | players / 100 m² |
| Ball–centroid distance | ‖centroid − ball‖ | m |

C is a bounded monotone transform of S: it adds no information but gives a comparable 0–1
scale. R is the largest possible distance from the pitch centre, so C ∈ [0, 1] for any
configuration on the pitch.

## Window-level (clustering input, `CLUSTER_FEATURES`)

Start/end state = mean over the first / last second of the window.

| Feature | Definition |
|---|---|
| `d_width`, `d_depth`, `d_area`, `d_compactness` | end − start |
| `lateral_shift` | \|end − start\| of normalised centroid y (magnitude: left and right shifts are the same behaviour) |
| `forward_shift` | end − start of normalised centroid x (signed: + = towards the opponent goal) |
| `centroid_speed` | centroid path length ÷ window duration |
| `width_mean`, `depth_mean` | mean over the window |
| `near_ball_mean` | mean players ≤ 10 m of ball |
| `density_mean` | mean ball-area density |
| `ball_dist_mean` | mean ball–centroid distance |
| `possession_share` | share of samples where SkillCorner assigns possession to the team |

13 features, all interpretable, all in physical units before scaling.

## Player-level (per loaded chunk)

Positions are smoothed with a centred 5-frame moving average, then differentiated. Speed above
12.5 m/s is treated as a tracking jump and discarded. Reported: distance, mean / max speed,
max |acceleration|, last heading, coverage (share of frames with an observation).
