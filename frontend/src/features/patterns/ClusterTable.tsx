import type { ClusterSummary } from "@/types/patterns";
import { pct, signed } from "@/utils/formatting";
import { clusterCode, patternColor } from "@/utils/patternStyle";

const stat = (c: ClusterSummary, key: string) => c.profile.find((f) => f.key === key)?.mean ?? null;

export function ClusterTable({
  clusters, selected, onSelect, homeLabel, awayLabel,
}: {
  clusters: ClusterSummary[];
  selected: number | null;
  onSelect: (id: number) => void;
  homeLabel: string;
  awayLabel: string;
}) {
  const head = "px-3 py-2 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-ink-400";
  const cell = "px-3 py-2 font-mono text-[12px] tabular-nums";
  return (
    <table className="w-full border-collapse">
      <thead className="border-b border-ink-700">
        <tr>
          <th className={head}>Cluster</th>
          <th className={`${head} text-right`}>Sequences</th>
          <th className={`${head} text-right`}>Windows</th>
          <th className={`${head} text-right`}>Avg duration</th>
          <th className={`${head} text-right`}>Width Δ</th>
          <th className={`${head} text-right`}>Area Δ</th>
          <th className={`${head} text-right`}>Possession</th>
          <th className={`${head} text-right`}>{homeLabel} / {awayLabel}</th>
          <th className={head}>Interpretation</th>
        </tr>
      </thead>
      <tbody>
        {clusters.map((c) => {
          const active = c.id === selected;
          return (
            <tr
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`cursor-pointer border-b border-ink-800 transition-colors ${active ? "bg-ink-800" : "hover:bg-ink-850"}`}
            >
              <td className="px-3 py-2">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2" style={{ background: patternColor(c.interpretation.label, c.id) }} />
                  <span className="font-mono text-[12px]">{clusterCode(c.id)}</span>
                </span>
              </td>
              <td className={`${cell} text-right`}>{c.n_episodes}</td>
              <td className={`${cell} text-right text-ink-400`}>{c.n_windows}</td>
              <td className={`${cell} text-right`}>{c.avg_duration_s.toFixed(1)}s</td>
              <td className={`${cell} text-right`}>{signed(stat(c, "d_width"))} m</td>
              <td className={`${cell} text-right`}>{signed(stat(c, "d_area"), 0)} m²</td>
              <td className={`${cell} text-right`}>{pct(stat(c, "possession_share") ?? 0)}</td>
              <td className={`${cell} text-right text-ink-300`}>
                {Math.round(c.side_share_home * 100)} / {Math.round((1 - c.side_share_home) * 100)}
              </td>
              <td className={`px-3 py-2 text-[12px] ${c.interpretation.label ? "text-ink-100" : "text-ink-500"}`}>
                {c.interpretation.label ?? "—"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
