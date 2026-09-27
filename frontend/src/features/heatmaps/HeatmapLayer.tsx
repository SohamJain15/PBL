import { memo } from "react";
import type { Heatmap } from "@/types/features";

// Sequential ramp: dark olive → amber → warm white (perceptually increasing lightness)
const RAMP: [number, number, number][] = [
  [38, 44, 30],
  [120, 96, 44],
  [212, 162, 76],
  [246, 228, 188],
];

function ramp(v: number): string {
  const x = Math.min(1, Math.max(0, v)) * (RAMP.length - 1);
  const i = Math.min(RAMP.length - 2, Math.floor(x));
  const f = x - i;
  const c = RAMP[i].map((a, k) => Math.round(a + (RAMP[i + 1][k] - a) * f));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/** Occupancy grid (server-computed), linear colour scale normalised to the busiest cell. */
export const HeatmapLayer = memo(function HeatmapLayer({ heatmap }: { heatmap: Heatmap }) {
  let max = 0;
  for (const row of heatmap.grid) for (const v of row) if (v > max) max = v;
  if (max <= 0) return null;
  const cells = [];
  for (let iy = 0; iy < heatmap.ny; iy++) {
    for (let ix = 0; ix < heatmap.nx; ix++) {
      const v = heatmap.grid[iy][ix] / max;
      if (v < 0.02) continue;
      const x = heatmap.x_min + ix * heatmap.bin_m;
      const y = heatmap.y_min + iy * heatmap.bin_m;
      cells.push(
        <rect
          key={`${ix}-${iy}`}
          x={x}
          y={-(y + heatmap.bin_m)}
          width={heatmap.bin_m + 0.03}
          height={heatmap.bin_m + 0.03}
          fill={ramp(v)}
          fillOpacity={0.25 + 0.7 * v}
        />,
      );
    }
  }
  return <g style={{ pointerEvents: "none" }}>{cells}</g>;
});

export function HeatmapLegend() {
  return (
    <div className="flex items-center gap-2 font-mono text-[10px] text-ink-400">
      <span>low</span>
      <span className="h-1.5 w-24" style={{ background: `linear-gradient(90deg, ${[0, 0.33, 0.66, 1].map(ramp).join(",")})` }} />
      <span>high</span>
    </div>
  );
}
