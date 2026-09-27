import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MatchDetail } from "@/types/match";
import type { DiscoverySummary } from "@/types/patterns";
import { clusterCode, patternShort, TEAM_COLORS } from "@/utils/patternStyle";

/** Discovered sequences per cluster, split by team. */
export function PatternFrequency({ d, match }: { d: DiscoverySummary; match: MatchDetail }) {
  const rows = d.clusters
    .map((c) => ({
      name: `${clusterCode(c.id)} ${patternShort(c.interpretation.label)}`,
      home: d.episodes.filter((e) => e.cluster_id === c.id && e.side === "home").length,
      away: d.episodes.filter((e) => e.cluster_id === c.id && e.side === "away").length,
      labelled: Boolean(c.interpretation.label),
    }))
    .sort((a, b) => Number(b.labelled) - Number(a.labelled) || b.home + b.away - (a.home + a.away));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }} barCategoryGap={5}>
        <XAxis type="number" stroke="#4a5058" tick={{ fontSize: 10, fill: "#6c727b", fontFamily: "JetBrains Mono" }} tickLine={false} />
        <YAxis type="category" dataKey="name" width={118} tick={{ fontSize: 11, fill: "#c3c7cc" }} tickLine={false} axisLine={false} />
        <Tooltip
          cursor={{ fill: "#1a1d21" }}
          contentStyle={{ background: "#14171a", border: "1px solid #30353b", borderRadius: 0, fontSize: 11 }}
          formatter={(v: number, name: string) => [v, name === "home" ? match.home.acronym : match.away.acronym]}
        />
        <Bar dataKey="home" stackId="s" fill={TEAM_COLORS.home} isAnimationActive={false} />
        <Bar dataKey="away" stackId="s" fill={TEAM_COLORS.away} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
