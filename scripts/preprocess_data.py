"""Parse raw tracking into the cached columnar representation (data/processed/*.npz)."""
from __future__ import annotations

import argparse
import time

import _bootstrap  # noqa: F401
from app.api.dependencies import get_repository
from app.data.preprocessing.quality import quality_summary


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--match", type=int, action="append", help="default: every match with tracking")
    args = parser.parse_args()
    repo = get_repository()
    ids = args.match or [m.id for m in repo.list_matches() if repo.tracking_available(m.id)]
    for mid in ids:
        t0 = time.perf_counter()
        repo.get_meta(mid)
        tr = repo.get_tracking(mid)
        q = quality_summary(tr, (tr.period > 0).nonzero()[0])
        print(f"{mid}: {tr.n_frames} frames, {tr.player_ids.size} players, detected={q.detected} "
              f"extrapolated={q.extrapolated} missing={q.missing} ({time.perf_counter() - t0:.1f}s)")


if __name__ == "__main__":
    main()
