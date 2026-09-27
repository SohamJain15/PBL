# SkillCorner Open Data

- Repository: https://github.com/SkillCorner/opendata (MIT License, © SkillCorner)
- Competition: Australian A-League 2024/25 — `matches.json` lists **20** matches.
- Tracking: broadcast-derived, 10 fps, `*_tracking_extrapolated.jsonl` (Git LFS, ~90 MB each).
- Also per match: `*_match.json`, `*_phases_of_play.csv`, `*_dynamic_events.csv`.

## Download

```bash
python scripts/download_data.py                    # index + metadata for all matches
python scripts/download_data.py --match 2017461    # add tracking for another match
python scripts/download_data.py --all              # every match (~1.8 GB)
```

Plain `git clone` of the SkillCorner repository gives LFS pointer files; the loader detects them
and reports that tracking is not available.

## Attribution

This project uses SkillCorner Open Data. All tracking, event and phase data belong to
SkillCorner and are used under the terms of their repository's MIT license.
