# Problem statement

**Title:** AI-Powered Spatiotemporal Tactical Pattern Mining for Multisport Analytics

Team sports produce continuous positional data: every player and the ball, many times per
second. Tactical behaviour — a block compressing around the ball, a lateral shift, a team
stretching the pitch — is a property of *how the collective shape evolves over a few seconds*,
not of any single frame or player.

The research question for this first milestone:

> Can recurring collective-movement patterns be discovered from broadcast-derived tracking data
> **without labels**, represented in an interpretable way, and presented so an analyst can
> inspect and judge them?

## Scope of Demo 1

- Football only, SkillCorner Open Data (A-League 2024/25).
- Representation: hand-crafted, interpretable team-shape dynamics over overlapping windows.
- Discovery: a transparent unsupervised baseline (standardisation + K-Means).
- Interpretation: explicit rules that read cluster profiles, kept separate from the model.

## Out of scope (not claimed)

Tactical classification accuracy, coach-level recommendations, player performance prediction,
match outcome prediction. None of these is implemented or validated.
