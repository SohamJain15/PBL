import type { RangeFeatures, TeamShapeValues } from "@/types/features";
import type { Side } from "@/types/match";
import { frameIndexAt } from "@/utils/interpolation";

/** Server-computed team shape at the provider frame at or before ``time`` (no client analytics). */
export function shapeAt(features: RangeFeatures | null, side: Side, time: number): TeamShapeValues | null {
  const team = features?.teams.find((t) => t.side === side);
  if (!team) return null;
  const i = frameIndexAt(team.t, time + 1e-6);
  if (i < 0) return null;
  return {
    width: team.width[i],
    depth: team.depth[i],
    area: team.area[i],
    compactness: team.compactness[i],
    stretch: team.stretch[i],
    near10: team.near_ball_10[i],
    near20: team.near_ball_20[i],
    density: team.density[i],
    centroid: team.centroid[i],
    hull: team.hull[i],
  };
}
