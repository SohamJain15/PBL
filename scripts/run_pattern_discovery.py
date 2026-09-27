"""Run unsupervised pattern discovery for a match and print a research summary."""
from __future__ import annotations

import argparse
import json

import _bootstrap  # noqa: F401
from app.api.dependencies import get_pattern_service
from app.core.config import PROJECT_ROOT, get_settings
from app.core.constants import DEFAULT_STEP_S, DEFAULT_WINDOW_S


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--match", type=int, default=get_settings().default_match_id)
    parser.add_argument("--window", type=float, default=DEFAULT_WINDOW_S)
    parser.add_argument("--step", type=float, default=DEFAULT_STEP_S)
    parser.add_argument("--k", type=int, default=None)
    parser.add_argument("--json", action="store_true", help="write experiments/results/<match>_discovery.json")
    args = parser.parse_args()

    s = get_pattern_service().summary(args.match, args.window, args.step, args.k)
    print(f"match {s.match_id} · {s.n_windows} windows · k={s.k} · silhouette {s.k_scores}")
    print(f"PCA explained variance: {s.pca_explained}")
    print(f"{'cluster':<8}{'seq':>6}{'win':>7}{'avg s':>7}  interpretation")
    for c in s.clusters:
        print(f"C{c.id + 1:02d}    {c.n_episodes:>6}{c.n_windows:>7}{c.avg_duration_s:>7.1f}  {c.interpretation.label or '—'}")
    if s.phase_agreement:
        print(f"agreement with SkillCorner phases: NMI={s.phase_agreement.nmi:.3f} ARI={s.phase_agreement.ari:.3f}")
    print(f"demo episode: {s.demo_episode_id}")
    if args.json:
        out = PROJECT_ROOT / "experiments" / "results" / f"{args.match}_discovery_{args.window}s_{args.step}s.json"
        out.write_text(json.dumps(s.model_dump(exclude={"embedding"}), indent=1))
        print("wrote", out)


if __name__ == "__main__":
    main()
