from __future__ import annotations


class TacticalLabError(Exception):
    """Base error for the application."""

    status_code: int = 500


class MatchNotFoundError(TacticalLabError):
    status_code = 404

    def __init__(self, match_id: int) -> None:
        super().__init__(f"Match {match_id} is not part of the dataset")


class TrackingNotAvailableError(TacticalLabError):
    status_code = 409

    def __init__(self, match_id: int) -> None:
        super().__init__(
            f"Tracking data for match {match_id} has not been downloaded. "
            f"Run: python scripts/download_data.py --match {match_id}"
        )


class InvalidRangeError(TacticalLabError):
    status_code = 422
