# Data schema (as observed, not assumed)

Verified with `python scripts/inspect_dataset.py --match 1886347`.

## `{id}_tracking_extrapolated.jsonl` — one JSON object per frame

| Field | Type | Notes |
|---|---|---|
| `frame` | int | provider frame number, 10 fps |
| `timestamp` | `"HH:MM:SS.ss"` or null | match clock; period 2 restarts at `00:45:00.00` |
| `period` | 1, 2 or null | null before kick-off |
| `ball_data` | `{x, y, z, is_detected}` | nulls when unknown |
| `possession` | `{player_id, group}` | `group` ∈ `"home team"`, `"away team"`, null; `player_id` set in 10,487 of 59,061 frames (match 1886347) |
| `image_corners_projection` | 8 floats | camera footprint on the pitch |
| `player_data` | list of `{x, y, player_id, is_detected}` | **22 entries or 0**; `is_detected=false` = extrapolated |

Coordinates: metres, origin at the centre spot, x along the length, y across; +y is the far
side of the broadcast image.

Match 1886347: 59,061 lines; 43,458 frames with 22 players, 15,584 with none;
566,778 detected vs 389,298 extrapolated player observations.

## `{id}_match.json`

`id, home_team{id,name,short_name,acronym}, away_team, home_team_kit{jersey_color,number_color},
away_team_kit, home_team_score, away_team_score, date_time, stadium{name,city,capacity},
competition_edition{competition{name}, season{name}}, competition_round{name},
match_periods[{period,start_frame,end_frame,duration_minutes}], home_team_side[per period],
pitch_length, pitch_width, players[{id, team_id, number, short_name, player_role{acronym},
trackable_object, playing_time, …}]`.

Tracking `player_id` = `players[].id` (not `trackable_object`).

## `{id}_phases_of_play.csv` (used as external reference)

`frame_start, frame_end, period, team_in_possession_id, team_in_possession_phase_type`
(`build_up, create, finish, direct, quick_break, transition, chaotic, set_play`),
`team_out_of_possession_phase_type` (`high_block, medium_block, low_block, defending_*, chaotic`), …

## `{id}_dynamic_events.csv` (used for goal context)

The event file contains provider event rows such as possession, passing-option, off-ball-run, and
on-ball-engagement records. Relevant fields include `index`, `frame_start`, `time_start`,
`period`, `event_type`, `event_subtype`, `team_id`, `team_shortname`, `team_score`, and
`opponent_team_score`.

The provider does not expose a dedicated `goal` event label in the files used by this project.
The backend therefore infers goals from score-state transitions ordered by frame. These records
provide the goal time and score context, but not a validated causal explanation for why the goal
was scored or conceded.

## Internal representation (`TrackingData`)

`frame (N) · period (N) · t (N, s) · ball (N,3) · ball_flag (N) · possession (N) ·
xy (N,P,2) · flag (N,P) · player_ids (P)` with flags −1 missing / 0 extrapolated / 1 detected
and possession 0 none / 1 home / 2 away.
