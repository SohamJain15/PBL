/** Frontend constants (rendering + playback). Analytical constants live in the backend. */
export const CHUNK_S = 30;
export const PREFETCH_BEFORE_END_S = 8;
export const PLAYBACK_SPEEDS = [0.5, 1, 2] as const;
export const TRAIL_OPTIONS_S = [2, 5, 10] as const;
export const MAX_INTERP_GAP_S = 0.15; // never interpolate across gaps larger than this
export const PLAYER_RADIUS_M = 0.95;
export const BALL_RADIUS_M = 0.5;
export const DEFAULT_ANALYSIS = { window_s: 5, step_s: 1, k: null } as const;
export const SHAPE_TIMELINE_BIN_S = 60;
