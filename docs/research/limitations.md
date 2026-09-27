# Current limitations

- **Broadcast tracking.** ~41% of player observations in match 1886347 are extrapolated by
  SkillCorner, and 26% of in-period frames have no player data at all (ball out of play,
  replays, cuts). Extrapolated positions are used in metrics (flagged in the UI); frames with
  no data are skipped.
- **Weak cluster separation.** Silhouette ≈ 0.16; clusters partition a continuum.
- **Overlapping windows are correlated.** Counts of windows overstate independent evidence;
  sequence (episode) counts are the fairer unit.
- **Per-match fitting.** Clusters and z-scores are relative to the selected match; cluster ids
  are not comparable across matches or parameter settings.
- **Rule thresholds are hand-set** (0.5σ, 0.75σ, possession 0.4 / 0.6) and not validated
  against expert labels.
- **Goalkeeper detection** relies on the provider role `GK`; a substitute goalkeeper appears as
  `SUB` and would be counted as an outfield player.
- **Possession** uses SkillCorner's `possession.group` per frame (team level). The ball-carrier
  `player_id` is present in only ~18% of frames, so it is displayed but not used as a feature.
- **One match with tracking is bundled.** Others require `scripts/download_data.py`
  (~90 MB each).
- **No video.** The replay is a 2-D reconstruction from tracking only.
