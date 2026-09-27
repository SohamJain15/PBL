"""Centralised analytical constants. Every threshold used by the analytics / ML layers lives here."""
from __future__ import annotations

# --- tracking -----------------------------------------------------------------
TRACKING_FPS: int = 10
FRAME_DT: float = 1.0 / TRACKING_FPS

# Detection flag encoding in the internal representation.
FLAG_MISSING: int = -1
FLAG_EXTRAPOLATED: int = 0
FLAG_DETECTED: int = 1

# Possession encoding.
POSSESSION_NONE: int = 0
POSSESSION_HOME: int = 1
POSSESSION_AWAY: int = 2

# --- API limits -----------------------------------------------------------------
MAX_FRAME_WINDOW_S: float = 120.0
MAX_FEATURE_WINDOW_S: float = 900.0
COORD_DECIMALS: int = 2

# --- team shape -----------------------------------------------------------------
MIN_PLAYERS_FOR_HULL: int = 3
# A team frame is considered valid for shape metrics with at least this many outfield players.
MIN_OUTFIELD_PLAYERS: int = 8
BALL_PROXIMITY_RADII_M: tuple[float, ...] = (10.0, 20.0)
DENSITY_RADIUS_M: float = 10.0
DENSITY_AREA_UNIT_M2: float = 100.0  # density reported as players per 100 m^2

# --- player kinematics ------------------------------------------------------------
SPEED_SMOOTHING_FRAMES: int = 5  # centred moving average before differentiation
MAX_PLAUSIBLE_SPEED_MS: float = 12.5  # above this a displacement is treated as a tracking jump

# --- temporal windows -------------------------------------------------------------
DEFAULT_WINDOW_S: float = 5.0
DEFAULT_STEP_S: float = 1.0
MIN_WINDOW_S: float = 2.0
MAX_WINDOW_S: float = 30.0
FEATURE_SAMPLE_HZ: int = 5  # shape metrics are computed at 5 Hz for window features
MIN_WINDOW_COVERAGE: float = 0.9  # fraction of window samples with a valid team shape
EDGE_SPAN_S: float = 1.0  # start/end state of a window = mean over first/last second

# --- pattern discovery ------------------------------------------------------------
K_CANDIDATES: tuple[int, ...] = (3, 4, 5, 6, 7, 8)
KMEANS_N_INIT: int = 10
RANDOM_STATE: int = 42
SILHOUETTE_SAMPLE_SIZE: int = 4000
PCA_COMPONENTS: int = 2
MAX_EMBEDDING_POINTS: int = 2500  # points returned to the browser (deterministic subsample)

# --- tactical interpretation (z-score thresholds on cluster means) -----------------
Z_STRONG: float = 0.5
Z_OVERLOAD: float = 0.75
OUT_OF_POSSESSION_MAX_SHARE: float = 0.4
IN_POSSESSION_MIN_SHARE: float = 0.6

# --- heatmap ------------------------------------------------------------------------
HEATMAP_BIN_M: float = 2.0
HEATMAP_SMOOTH_SIGMA_BINS: float = 1.0
