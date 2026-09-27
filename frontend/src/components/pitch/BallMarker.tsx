import { FLAG_EXTRAPOLATED } from "@/types/tracking";
import { BALL_RADIUS_M } from "@/utils/constants";

export function BallMarker({ x, y, flag }: { x: number; y: number; flag: number }) {
  const extrapolated = flag === FLAG_EXTRAPOLATED;
  return (
    <g transform={`translate(${x} ${-y})`} style={{ pointerEvents: "none" }}>
      <circle r={BALL_RADIUS_M + 0.35} fill="rgba(10,11,13,0.35)" />
      <circle
        r={BALL_RADIUS_M}
        fill={extrapolated ? "none" : "#f4f1e8"}
        stroke="#f4f1e8"
        strokeWidth={0.12}
        strokeDasharray={extrapolated ? "0.2 0.15" : undefined}
      />
    </g>
  );
}
