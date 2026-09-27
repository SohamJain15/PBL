import type { MatchDetail } from "@/types/match";
import type { DiscoverySummary } from "@/types/patterns";
import { clusterCode, patternColor, patternShort } from "@/utils/patternStyle";

const ROW_H = 20;
const LABEL_W = 120;
const W = 860;

/** When each discovered pattern occurs across the whole match (both periods, both teams). */
export function PatternDistribution({ d, match }: { d: DiscoverySummary; match: MatchDetail }) {
  const periods = match.periods;
  const total = periods.reduce((a, p) => a + (p.end_s - p.start_s), 0);
  const gap = 12;
  const plotW = W - LABEL_W - gap * (periods.length - 1);
  const offsets = new Map<number, number>();
  let acc = LABEL_W;
  for (const p of periods) {
    offsets.set(p.period, acc);
    acc += ((p.end_s - p.start_s) / total) * plotW + gap;
  }
  const xOf = (period: number, t: number) => {
    const p = periods.find((x) => x.period === period)!;
    return offsets.get(period)! + ((t - p.start_s) / total) * plotW;
  };
  const clusters = [...d.clusters].sort((a, b) => Number(!a.interpretation.label) - Number(!b.interpretation.label) || a.id - b.id);
  const H = clusters.length * ROW_H + 20;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {periods.map((p) => (
        <g key={p.period}>
          <text x={xOf(p.period, p.start_s)} y={10} fontSize={10} fill="#6c727b" fontFamily="JetBrains Mono">
            P{p.period} · {Math.round(p.start_s / 60)}′
          </text>
          <text x={xOf(p.period, p.end_s)} y={10} fontSize={9} fill="#6c727b" fontFamily="JetBrains Mono" textAnchor="end">
            {Math.round(p.end_s / 60)}′
          </text>
        </g>
      ))}
      {clusters.map((c, r) => {
        const y = 16 + r * ROW_H;
        const color = patternColor(c.interpretation.label, c.id);
        return (
          <g key={c.id}>
            <text x={0} y={y + 12} fontSize={10} fill="#6c727b" fontFamily="JetBrains Mono">{clusterCode(c.id)}</text>
            <text x={32} y={y + 12} fontSize={12} fill={c.interpretation.label ? "#c3c7cc" : "#6c727b"}>{patternShort(c.interpretation.label)}</text>
            {periods.map((p) => (
              <rect key={p.period} x={xOf(p.period, p.start_s)} y={y + 2} width={xOf(p.period, p.end_s) - xOf(p.period, p.start_s)} height={ROW_H - 5} fill="#14171a" />
            ))}
            {d.episodes
              .filter((e) => e.cluster_id === c.id)
              .map((e) => (
                <rect
                  key={e.id}
                  x={xOf(e.period, e.start_s)}
                  y={y + (e.side === "home" ? 2 : 2 + (ROW_H - 5) / 2)}
                  width={Math.max(1, xOf(e.period, e.end_s) - xOf(e.period, e.start_s))}
                  height={(ROW_H - 5) / 2}
                  fill={color}
                  fillOpacity={0.85}
                >
                  <title>{`${clusterCode(c.id)} · ${match[e.side].acronym} · P${e.period} ${Math.floor(e.start_s / 60)}′`}</title>
                </rect>
              ))}
          </g>
        );
      })}
    </svg>
  );
}
