# Goal impact analysis

## Purpose

The goal impact review helps an analyst inspect measurable team-state signals around a goal. It
answers two questions:

1. Which characteristics of the conceding team's state may have made the situation vulnerable?
2. Which characteristics of the scoring team's state may have supported the attack?

The feature is descriptive and evidence-based. It does not claim that tracking alone proves the
cause of a goal.

## Inputs

For a selected match, the backend combines:

- `*_dynamic_events.csv` for score-state transitions, event time, period, frame, teams, and score.
- `*_tracking_extrapolated.jsonl` for player and ball positions, possession, and detection flags.
- Match metadata for team identity, pitch dimensions, periods, and player roles.
- Phases of play for contextual labels such as `create`, `finish`, `high_block`, and `low_block`.
- The existing pattern-discovery result for the episode and cluster active near the goal timestamp.

The provider data does not contain a dedicated `goal` event or a validated goal-cause label. Goals
are therefore inferred from score-state changes ordered by frame.

## Analysis window

The default evidence window is the 15 seconds ending at the inferred goal timestamp. Each team's
values in that window are compared with the team's valid samples across the selected match. The
comparison is expressed as a z-score:

$$
z = \frac{\mu_{goal\ window} - \mu_{match\ baseline}}{\sigma_{match\ baseline}}
$$

A factor is shown only when its signed deviation exceeds the configured evidence threshold. The
UI separates the results into possible weaknesses for the conceding team and attacking signals for
the scoring team.

## Current factors

| Factor | Interpretation as a possible weakness | Interpretation as an attacking signal |
|---|---|---|
| Compactness | Defensive shape is less compact than usual | Attacking shape is more compact than usual |
| Players within 10 m of ball | Fewer players are close to the defensive action | More players are concentrated near the ball |
| Ball-to-centroid distance | Team centroid is farther from the ball | Team shape is stretched around the ball |
| Width | Defensive shape is wider than usual | Attack occupies more lateral space |
| Area | Defensive shape occupies more space than usual | Attack expands the occupied area |
| Possession share | Low possession before the goal | High possession before the goal |

Each displayed factor includes its observed value, match baseline, z-score, and a plain-language
explanation.

## API

```text
GET /api/matches/{match_id}/goals
GET /api/matches/{match_id}/goals/{goal_id}/analysis
```

The goal list returns the inferred goal time, period, frame, scoring and conceding teams, and score
after the goal. The analysis endpoint returns the evidence window, factors, phase, and pattern
context.

## Frontend workflow

The Analysis page loads the goal list after a match is selected. Selecting a goal loads its
analysis and displays:

- scoring team and conceding team;
- period and 15-second context interval;
- phase and model-discovered pattern context;
- possible weaknesses for the conceding team;
- attacking signals for the scoring team;
- metric values compared with the match baseline.

No goal replay is currently included. The existing Match page replay remains available for model
pattern episodes, but goal impact analysis is presented as an analytical report in the Analysis
view.

## Interpretation rules

The factors should be read as prompts for analyst inspection, not as automatic tactical diagnoses.
For example, a high width value may indicate a stretched defensive block, but it may also reflect
team direction, phase boundaries, or tracking noise. A low possession share does not identify the
specific turnover, pass, or defensive action that led to the goal.

## Limitations

- Score transitions may be recorded at a later possession or restart event rather than the exact
  shot instant.
- Tracking may contain missing or extrapolated observations around the inferred goal time.
- There is no video, shot location, pass-chain model, pressure assignment, or goalkeeper-action
  model in the current implementation.
- Baselines and z-scores are match-specific; values and cluster IDs are not directly comparable
  across matches without a defined cross-match calibration.
- The factors are not validated against analyst annotations or causal event labels.

## Recommended presentation wording

Use wording such as:

> The system identified possible defensive and attacking contributors by comparing team-shape
> metrics in the 15 seconds before an inferred goal with each team's match baseline.

Avoid wording such as:

> The model proved why the goal happened.

That distinction is central to the project's research integrity.
