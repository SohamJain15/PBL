"""Rule-based tactical interpretation of *model-discovered* clusters (FootballPatternInterpreter).

The clustering model knows nothing about football. This layer reads a cluster's mean feature
profile (z-scores relative to all windows of the match, plus raw possession share) and checks it
against explicit, documented rules. Output is an interpretation, not a ground-truth label.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Callable

from app.core.constants import IN_POSSESSION_MIN_SHARE, OUT_OF_POSSESSION_MAX_SHARE, Z_OVERLOAD, Z_STRONG
from app.models.pattern import Interpretation

Profile = dict[str, float]  # feature -> cluster-mean z-score; "possession_share_raw" -> share


@dataclass(frozen=True)
class Rule:
    label: str
    description: str
    test: Callable[[Profile], bool]
    evidence: tuple[str, ...]


def _oop(p: Profile) -> bool:
    return p["possession_share_raw"] <= OUT_OF_POSSESSION_MAX_SHARE


def _ip(p: Profile) -> bool:
    return p["possession_share_raw"] >= IN_POSSESSION_MIN_SHARE


FOOTBALL_RULES: tuple[Rule, ...] = (
    Rule(
        "Defensive Compression",
        f"out of possession (share ≤ {OUT_OF_POSSESSION_MAX_SHARE}), width Δ and area Δ ≤ −{Z_STRONG}σ",
        lambda p: _oop(p) and p["d_width"] <= -Z_STRONG and p["d_area"] <= -Z_STRONG,
        ("possession_share_raw", "d_width", "d_area", "d_compactness"),
    ),
    Rule(
        "Defensive Shift",
        f"out of possession, lateral shift ≥ {Z_STRONG}σ, |area Δ| < {Z_STRONG}σ",
        lambda p: _oop(p) and p["lateral_shift"] >= Z_STRONG and abs(p["d_area"]) < Z_STRONG,
        ("possession_share_raw", "lateral_shift", "d_area"),
    ),
    Rule(
        "Wing Expansion",
        f"in possession (share ≥ {IN_POSSESSION_MIN_SHARE}), width Δ and area Δ ≥ {Z_STRONG}σ",
        lambda p: _ip(p) and p["d_width"] >= Z_STRONG and p["d_area"] >= Z_STRONG,
        ("possession_share_raw", "d_width", "d_area"),
    ),
    Rule(
        "Local Overload",
        f"players ≤10 m of ball or ball-area density ≥ {Z_OVERLOAD}σ",
        lambda p: p["near_ball_mean"] >= Z_OVERLOAD or p["density_mean"] >= Z_OVERLOAD,
        ("near_ball_mean", "density_mean"),
    ),
)


class FootballPatternInterpreter:
    def __init__(self, rules: tuple[Rule, ...] = FOOTBALL_RULES) -> None:
        self.rules = rules

    def interpret(self, profile: Profile) -> Interpretation:
        matched = [r for r in self.rules if r.test(profile)]
        if not matched:
            return Interpretation(label=None)
        evidence_keys = {k for r in matched for k in r.evidence}
        return Interpretation(
            label=matched[0].label,
            rules_matched=[r.label for r in matched],
            evidence={k: round(float(profile[k]), 3) for k in sorted(evidence_keys)},
        )

    def rule_catalogue(self) -> list[dict[str, str]]:
        return [{"label": r.label, "rule": r.description} for r in self.rules]
