import { memo } from "react";

const BUCKETS = 4;

/** Recent raw positions of one player; older segments fade out. Drawn as a few polylines. */
export const Trajectory = memo(function Trajectory({ points, color }: { points: number[]; color: string }) {
  const n = points.length / 2;
  if (n < 2) return null;
  const lines = [];
  for (let b = 0; b < BUCKETS; b++) {
    const from = Math.floor((b * (n - 1)) / BUCKETS);
    const to = Math.floor(((b + 1) * (n - 1)) / BUCKETS);
    if (to <= from) continue;
    const pts: string[] = [];
    for (let i = from; i <= to; i++) pts.push(`${points[2 * i]},${-points[2 * i + 1]}`);
    lines.push(
      <polyline
        key={b}
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeOpacity={0.15 + (0.65 * (b + 1)) / BUCKETS}
        strokeWidth={0.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />,
    );
  }
  return <g style={{ pointerEvents: "none" }}>{lines}</g>;
});
