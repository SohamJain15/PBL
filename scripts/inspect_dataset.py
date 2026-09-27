"""Print the real structure of the SkillCorner files for one match (no assumptions about the schema)."""
from __future__ import annotations

import argparse
import json
from collections import Counter

import pandas as pd

import _bootstrap  # noqa: F401
from app.core.config import get_settings


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--match", type=int, default=get_settings().default_match_id)
    parser.add_argument("--frames", type=int, default=5000, help="tracking frames to profile")
    args = parser.parse_args()
    root = get_settings().raw_dir
    index = json.loads((root / "matches.json").read_text())
    print(f"matches.json: {len(index)} matches; keys = {sorted(index[0])}")

    mdir = root / "matches" / str(args.match)
    print(f"\n{mdir}")
    for f in sorted(mdir.iterdir()):
        print(f"  {f.name:<45} {f.stat().st_size / 1e6:8.2f} MB")

    meta = json.loads((mdir / f"{args.match}_match.json").read_text())
    print("\nmatch.json keys:", sorted(meta))
    print("player keys:", sorted(meta["players"][0]))
    print("periods:", meta["match_periods"])
    print("home_team_side:", meta.get("home_team_side"), "pitch:", meta["pitch_length"], "x", meta["pitch_width"])

    path = mdir / f"{args.match}_tracking_extrapolated.jsonl"
    with path.open() as fh:
        head = fh.read(200)
    if head.startswith("version https://git-lfs"):
        print("\ntracking file is a Git-LFS pointer → run scripts/download_data.py --match", args.match)
        return
    n_players, det, poss = Counter(), Counter(), Counter()
    with path.open() as fh:
        for i, line in enumerate(fh):
            if i >= args.frames:
                break
            d = json.loads(line)
            if i == 20:
                print("\nframe keys:", sorted(d), "\nplayer_data[0]:", d["player_data"][0] if d["player_data"] else None)
            n_players[len(d["player_data"])] += 1
            poss[(d.get("possession") or {}).get("group")] += 1
            det.update(p["is_detected"] for p in d["player_data"])
    print("players per frame:", dict(n_players))
    print("is_detected:", dict(det))
    print("possession.group:", dict(poss))

    for name in ("phases_of_play", "dynamic_events"):
        p = mdir / f"{args.match}_{name}.csv"
        if p.exists():
            df = pd.read_csv(p, low_memory=False)
            print(f"\n{name}: {df.shape}; first columns: {list(df.columns)[:12]}")


if __name__ == "__main__":
    main()
