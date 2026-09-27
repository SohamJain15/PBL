"""Compute the 5 Hz team-shape series and the window feature table; optionally export to CSV."""
from __future__ import annotations

import argparse

import _bootstrap  # noqa: F401
from app.api.dependencies import get_feature_service
from app.core.config import PROJECT_ROOT, get_settings
from app.core.constants import DEFAULT_STEP_S, DEFAULT_WINDOW_S


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--match", type=int, default=get_settings().default_match_id)
    parser.add_argument("--window", type=float, default=DEFAULT_WINDOW_S)
    parser.add_argument("--step", type=float, default=DEFAULT_STEP_S)
    parser.add_argument("--csv", action="store_true", help="write experiments/results/<match>_windows.csv")
    args = parser.parse_args()
    fs = get_feature_service()
    table = fs.window_table(args.match, args.window, args.step)
    print(f"{len(table)} team-windows ({args.window}s / {args.step}s)")
    print(table.describe().T[["mean", "std", "min", "max"]].round(2).to_string())
    if args.csv:
        out = PROJECT_ROOT / "experiments" / "results" / f"{args.match}_windows_{args.window}s_{args.step}s.csv"
        table.to_csv(out, index=False)
        print("wrote", out)


if __name__ == "__main__":
    main()
