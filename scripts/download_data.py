"""Download SkillCorner Open Data into data/raw/skillcorner/.

Tracking files are stored with Git LFS in the SkillCorner repository (~90 MB each), so a plain
`git clone` only yields pointer files. This script fetches the real files over HTTPS.

Examples
    python scripts/download_data.py                      # index + metadata for all matches
    python scripts/download_data.py --match 1886347      # + tracking for one match
    python scripts/download_data.py --all                # tracking for every match (~1.8 GB)
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import requests

import _bootstrap  # noqa: F401
from app.core.config import get_settings

CHUNK = 1 << 20


def fetch(url: str, dest: Path, overwrite: bool = False) -> None:
    if dest.exists() and not overwrite and dest.stat().st_size > 1024:
        print(f"  = {dest.name} (exists)")
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(dest.suffix + ".part")
    with requests.get(url, stream=True, timeout=60) as r:
        r.raise_for_status()
        total = int(r.headers.get("content-length", 0))
        done = 0
        with tmp.open("wb") as fh:
            for block in r.iter_content(CHUNK):
                fh.write(block)
                done += len(block)
                if total:
                    print(f"\r  ↓ {dest.name} {done / total:6.1%}", end="", flush=True)
    tmp.replace(dest)
    print(f"\r  ✓ {dest.name} ({done / 1e6:.1f} MB)")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--match", type=int, action="append", default=[], help="match id to fetch tracking for")
    parser.add_argument("--all", action="store_true", help="fetch tracking for every match")
    parser.add_argument("--events", action="store_true", help="also fetch dynamic_events.csv")
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()

    s = get_settings()
    root = s.raw_dir
    print(f"Target: {root}")
    fetch(f"{s.skillcorner_raw_url}/matches.json", root / "matches.json", overwrite=True)
    matches = [int(m["id"]) for m in json.loads((root / "matches.json").read_text())]
    tracking_ids = matches if args.all else args.match

    for mid in matches:
        base = f"matches/{mid}/{mid}"
        print(f"match {mid}")
        fetch(f"{s.skillcorner_raw_url}/{base}_match.json", root / f"{base}_match.json", args.overwrite)
        fetch(f"{s.skillcorner_raw_url}/{base}_phases_of_play.csv", root / f"{base}_phases_of_play.csv", args.overwrite)
        if args.events or mid in tracking_ids:
            fetch(f"{s.skillcorner_raw_url}/{base}_dynamic_events.csv", root / f"{base}_dynamic_events.csv", args.overwrite)
        if mid in tracking_ids:
            fetch(f"{s.skillcorner_lfs_url}/{base}_tracking_extrapolated.jsonl",
                  root / f"{base}_tracking_extrapolated.jsonl", args.overwrite)
    print("done")
    return 0


if __name__ == "__main__":
    sys.exit(main())
