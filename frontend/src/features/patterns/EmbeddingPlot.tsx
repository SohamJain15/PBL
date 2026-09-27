import { memo, useMemo, useState } from "react";
import type { ClusterSummary, EmbeddingPoint } from "@/types/patterns";
import { clockShort } from "@/utils/formatting";
import { clusterCode, patternColor } from "@/utils/patternStyle";

const W = 560;
const H = 380;
const PAD = 28;

/** PCA projection of the standardised window features. Each point = one team-window. */
export const EmbeddingPlot = memo(function EmbeddingPlot({
  points, clusters, selected, explained, onPick,
}: {
  points: EmbeddingPoint[];
  clusters: ClusterSummary[];
  selected: number | null;
  explained: number[];
  onPick: (p: EmbeddingPoint) => void;
}) {
  const [hover, setHover] = useState<EmbeddingPoint | null>(null);
  const labels = useMemo(() => new Map(clusters.map((c) => [c.id, c.interpretation.label])), [clusters]);
  const { sx, sy, ticksX, ticksY } = useMemo(() => {
    const q = (arr: number[], p: number) => {
      const s = [...arr].sort((a, b) => a - b);
      return s[Math.floor(p * (s.length - 1))];
    };
    // robust extent (0.5–99.5 pct) so a few outliers do not squash the cloud
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const [x0, x1, y0, y1] = [q(xs, 0.005), q(xs, 0.995), q(ys, 0.005), q(ys, 0.995)];
    const sxF = (v: number) => PAD + ((v - x0) / (x1 - x0 || 1)) * (W - 2 * PAD);
    const syF = (v: number) => H - PAD - ((v - y0) / (y1 - y0 || 1)) * (H - 2 * PAD);
    const ticks = (a: number, b: number) => {
      const out: number[] = [];
      for (let t = Math.ceil(a); t <= Math.floor(b); t += 1) out.push(t);
      return out;
    };
    return { sx: sxF, sy: syF, ticksX: ticks(x0, x1), ticksY: ticks(y0, y1) };
  }, [points]);

  const ordered = useMemo(
    () => (selected === null ? points : [...points.filter((p) => p.cluster_id !== selected), ...points.filter((p) => p.cluster_id === selected)]),
    [points, selected],
  );

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseLeave={() => setHover(null)}>
        <rect x={PAD} y={PAD} width={W - 2 * PAD} height={H - 2 * PAD} fill="#0f1113" stroke="#24282d" />
        {ticksX.map((t) => (
          <line key={`x${t}`} x1={sx(t)} x2={sx(t)} y1={PAD} y2={H - PAD} stroke="#1a1d21" />
        ))}
        {ticksY.map((t) => (
          <line key={`y${t}`} y1={sy(t)} y2={sy(t)} x1={PAD} x2={W - PAD} stroke="#1a1d21" />
        ))}
        {ordered.map((p) => {
          const inSel = selected === null || p.cluster_id === selected;
          const x = sx(p.x);
          const y = sy(p.y);
          if (x < PAD || x > W - PAD || y < PAD || y > H - PAD) return null;
          return (
            <circle
              key={p.window_id}
              cx={x}
              cy={y}
              r={inSel && selected !== null ? 2.4 : 1.8}
              fill={patternColor(labels.get(p.cluster_id) ?? null, p.cluster_id)}
              fillOpacity={inSel ? 0.8 : 0.12}
              onMouseEnter={() => setHover(p)}
              onClick={() => onPick(p)}
              style={{ cursor: "pointer" }}
            />
          );
        })}
        {hover && <circle cx={sx(hover.x)} cy={sy(hover.y)} r={4.5} fill="none" stroke="#e6e7e4" strokeWidth={1} />}
        <text x={W - PAD} y={H - 8} textAnchor="end" fontSize={10} fill="#6c727b" fontFamily="JetBrains Mono">
          PC1 · {(explained[0] * 100).toFixed(1)}% var
        </text>
        <text x={10} y={PAD - 10} fontSize={10} fill="#6c727b" fontFamily="JetBrains Mono">
          PC2 · {(explained[1] * 100).toFixed(1)}% var
        </text>
      </svg>
      {hover && (
        <div className="pointer-events-none absolute right-3 top-3 border border-ink-600 bg-ink-850 px-2.5 py-1.5 text-[11px]">
          <div className="font-mono text-ink-100">
            {clusterCode(hover.cluster_id)} · {hover.side} · P{hover.period} {clockShort(hover.start_s)}
          </div>
          <div className="text-ink-400">{labels.get(hover.cluster_id) ?? "Unlabelled"} · click to replay</div>
        </div>
      )}
    </div>
  );
});
