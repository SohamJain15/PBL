import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Segmented } from "@/components/common/Segmented";
import { Loading } from "@/components/common/Status";
import { useAsync } from "@/hooks/useAsync";
import { fetchShapeTimeline } from "@/services/tracking";
import type { MatchDetail } from "@/types/match";
import { SHAPE_TIMELINE_BIN_S } from "@/utils/constants";
import { TEAM_COLORS } from "@/utils/patternStyle";

type Metric = "width" | "depth" | "area" | "compactness";
const UNITS: Record<Metric, string> = { width: "m", depth: "m", area: "m²", compactness: "" };

export function TeamShapeChart({ match }: { match: MatchDetail }) {
  const [period, setPeriod] = useState(1);
  const [metric, setMetric] = useState<Metric>("width");
  const { data } = useAsync(() => fetchShapeTimeline(match.id, period, SHAPE_TIMELINE_BIN_S), [match.id, period]);
  const rows =
    data?.t.map((t, i) => ({ minute: t / 60, home: data.home[metric][i], away: data.away[metric][i] })) ?? [];
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 py-2">
        <Segmented<Metric>
          size="xs"
          value={metric}
          onChange={setMetric}
          options={[
            { value: "width", label: "Width" },
            { value: "depth", label: "Depth" },
            { value: "area", label: "Area" },
            { value: "compactness", label: "Compactness" },
          ]}
        />
        <Segmented<number> size="xs" value={period} onChange={setPeriod} options={match.periods.map((p) => ({ value: p.period, label: `P${p.period}` }))} />
        <span className="ml-auto flex items-center gap-3 text-[10px] text-ink-400">
          {(["home", "away"] as const).map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className="h-0.5 w-3" style={{ background: TEAM_COLORS[s] }} />
              {match[s].acronym}
            </span>
          ))}
          <span className="font-mono text-ink-500">{SHAPE_TIMELINE_BIN_S}s means</span>
        </span>
      </div>
      <div className="min-h-0 flex-1 px-2 pb-2">
        {!data ? (
          <div className="flex h-full items-center justify-center"><Loading /></div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid stroke="#1a1d21" vertical={false} />
              <XAxis
                dataKey="minute"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(v: number) => `${Math.round(v)}′`}
                stroke="#4a5058"
                tick={{ fontSize: 10, fill: "#6c727b", fontFamily: "JetBrains Mono" }}
                tickLine={false}
              />
              <YAxis
                stroke="#4a5058"
                width={44}
                tick={{ fontSize: 10, fill: "#6c727b", fontFamily: "JetBrains Mono" }}
                tickLine={false}
                axisLine={false}
                domain={["auto", "auto"]}
              />
              <Tooltip
                cursor={{ stroke: "#6c727b", strokeWidth: 1 }}
                contentStyle={{ background: "#14171a", border: "1px solid #30353b", borderRadius: 0, fontSize: 11 }}
                labelFormatter={(v: number) => `${v.toFixed(1)}′`}
                formatter={(v: number, name: string) => [`${v?.toFixed(metric === "compactness" ? 3 : 1)} ${UNITS[metric]}`, name === "home" ? match.home.acronym : match.away.acronym]}
              />
              <Line type="monotone" dataKey="home" stroke={TEAM_COLORS.home} dot={false} strokeWidth={1.5} connectNulls={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="away" stroke={TEAM_COLORS.away} dot={false} strokeWidth={1.5} connectNulls={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
