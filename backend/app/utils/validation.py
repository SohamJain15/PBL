from __future__ import annotations

from app.core.exceptions import InvalidRangeError


def validate_range(start_s: float, end_s: float, max_span_s: float) -> None:
    if end_s <= start_s:
        raise InvalidRangeError("'end' must be greater than 'start'")
    if end_s - start_s > max_span_s + 1e-6:
        raise InvalidRangeError(f"Requested span exceeds {max_span_s:.0f} s")


def validate_side(side: str) -> str:
    if side not in ("home", "away"):
        raise InvalidRangeError("side must be 'home' or 'away'")
    return side
