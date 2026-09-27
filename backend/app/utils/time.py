from __future__ import annotations


def parse_clock(value: str | None) -> float | None:
    """Parse ``HH:MM:SS.ss`` (or ``MM:SS.s``) into seconds."""
    if value is None or value == "":
        return None
    parts = [float(p) for p in value.split(":")]
    seconds = 0.0
    for part in parts:
        seconds = seconds * 60 + part
    return seconds


def format_clock(seconds: float) -> str:
    total = max(0.0, seconds)
    minutes = int(total // 60)
    return f"{minutes:02d}:{total - minutes * 60:04.1f}"
