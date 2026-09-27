import type { FrameChunk, PlayerState, SceneState } from "@/types/tracking";
import { FLAG_MISSING } from "@/types/tracking";
import { MAX_INTERP_GAP_S } from "./constants";

/** Index of the last frame with t <= time (binary search). -1 if before the chunk. */
export function frameIndexAt(t: number[], time: number): number {
  let lo = 0;
  let hi = t.length - 1;
  if (hi < 0 || time < t[0]) return -1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (t[mid] <= time) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/**
 * Scene at ``time``. Positions are linearly interpolated between two consecutive provider frames
 * only when ``interpolate`` is set and the frames are contiguous (≤ MAX_INTERP_GAP_S apart);
 * otherwise the previous raw frame is shown. Interpolation is for display continuity only.
 */
export function sceneAt(chunk: FrameChunk, time: number, interpolate: boolean): SceneState | null {
  const i = frameIndexAt(chunk.t, time);
  if (i < 0) return null;
  const j = Math.min(i + 1, chunk.t.length - 1);
  const t0 = chunk.t[i];
  const t1 = chunk.t[j];
  const gap = t1 - t0;
  const canLerp = interpolate && j !== i && gap > 0 && gap <= MAX_INTERP_GAP_S;
  const a = canLerp ? Math.min(1, Math.max(0, (time - t0) / gap)) : 0;
  const exact = a < 1e-3;

  const players: PlayerState[] = [];
  const xy0 = chunk.xy[i];
  const xy1 = chunk.xy[j];
  const f0 = chunk.flag[i];
  for (let p = 0; p < chunk.player_ids.length; p++) {
    const x0 = xy0[2 * p];
    const y0 = xy0[2 * p + 1];
    if (x0 === null || y0 === null || f0[p] === FLAG_MISSING) continue;
    const x1 = xy1[2 * p];
    const y1 = xy1[2 * p + 1];
    const lerp = canLerp && x1 !== null && y1 !== null;
    players.push({
      id: chunk.player_ids[p],
      x: lerp ? x0 + (x1 - x0) * a : x0,
      y: lerp ? y0 + (y1 - y0) * a : y0,
      flag: f0[p],
    });
  }

  const b0 = chunk.ball[i];
  const b1 = chunk.ball[j];
  let ball: SceneState["ball"] = null;
  if (b0[0] !== null && b0[1] !== null) {
    const lerp = canLerp && b1[0] !== null && b1[1] !== null;
    ball = {
      x: lerp ? b0[0] + ((b1[0] as number) - b0[0]) * a : b0[0],
      y: lerp ? b0[1] + ((b1[1] as number) - b0[1]) * a : b0[1],
      flag: (b0[3] as number) ?? FLAG_MISSING,
    };
  }
  return {
    t: time,
    frame: chunk.frame[i],
    exact,
    interpolated: canLerp && !exact,
    players,
    ball,
    possession: chunk.possession[i],
    carrier: chunk.possession_player[i],
  };
}

/** Raw (non-interpolated) positions of one player between [from, to]. */
export function trailOf(chunk: FrameChunk, playerId: number, from: number, to: number): number[] {
  const p = chunk.player_ids.indexOf(playerId);
  if (p < 0) return [];
  const start = Math.max(0, frameIndexAt(chunk.t, from));
  const end = frameIndexAt(chunk.t, to);
  const pts: number[] = [];
  for (let i = start; i <= end; i++) {
    const x = chunk.xy[i][2 * p];
    const y = chunk.xy[i][2 * p + 1];
    if (x !== null && y !== null) pts.push(x, y);
  }
  return pts;
}
