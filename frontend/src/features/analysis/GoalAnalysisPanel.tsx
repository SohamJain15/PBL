import { useState } from "react";
import { ErrorNote, Loading } from "@/components/common/Status";
import { useAsync } from "@/hooks/useAsync";
import { fetchGoalAnalysis, fetchGoals } from "@/services/goals";
import type { GoalFactor } from "@/types/goals";
import type { MatchDetail } from "@/types/match";
import { clock } from "@/utils/formatting";
import { TEAM_COLORS } from "@/utils/patternStyle";

function factorValue(value: number | null, unit: string): string {
  if (value === null || !Number.isFinite(value)) return "—";
  if (unit === "%") return `${(value * 100).toFixed(0)}%`;
  return `${value.toFixed(unit === "" ? 2 : 1)}${unit ? ` ${unit}` : ""}`;
}

function Factor({ factor }: { factor: GoalFactor }) {
  return (
    <div className="border-b border-ink-800 py-2 last:border-b-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[12px] text-ink-200">{factor.label}</span>
        <span className="font-mono text-[11px] text-ink-300">
          {factorValue(factor.value, factor.unit)} <span className="text-ink-500">vs {factorValue(factor.baseline, factor.unit)}</span>
        </span>
      </div>
      <div className="mt-1 flex items-start justify-between gap-3 text-[10px] text-ink-500">
        <span>{factor.explanation}</span>
        <span className="shrink-0 font-mono text-ink-400">z {factor.z_score?.toFixed(2) ?? "—"}</span>
      </div>
    </div>
  );
}

function FactorList({ title, factors, empty }: { title: string; factors: GoalFactor[]; empty: string }) {
  return (
    <div className="border-t border-ink-800 px-4 py-3">
      <div className="label mb-1.5">{title}</div>
      {factors.length ? factors.map((factor) => <Factor key={factor.key} factor={factor} />) : <div className="text-[11px] text-ink-500">{empty}</div>}
    </div>
  );
}

export function GoalAnalysisPanel({ match }: { match: MatchDetail }) {
  const goals = useAsync(() => fetchGoals(match.id), [match.id]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = goals.data?.find((goal) => goal.id === selectedId) ?? goals.data?.[0] ?? null;
  const analysis = useAsync(
    selected ? () => fetchGoalAnalysis(match.id, selected.id) : null,
    [match.id, selected?.id],
  );

  return (
    <section className="border-b border-ink-700">
      <header className="flex min-h-9 items-center justify-between border-b border-ink-700 px-4 py-2">
        <div>
          <h2 className="label text-ink-200">Goal impact review</h2>
          <p className="mt-1 text-[10px] text-ink-500">Measured signals from the 15 seconds before each goal. These are possible contributors, not causal proof.</p>
        </div>
        {goals.data && <span className="font-mono text-[10px] text-ink-500">{goals.data.length} goals</span>}
      </header>
      {goals.loading && <div className="px-4 py-6"><Loading label="Loading goals" /></div>}
      {goals.error && <div className="p-4"><ErrorNote error={goals.error} /></div>}
      {goals.data && !goals.data.length && <div className="px-4 py-6 text-[11px] text-ink-500">No goal events are available for this match.</div>}
      {goals.data && goals.data.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-px bg-ink-800 p-px md:grid-cols-5">
            {goals.data.map((goal) => (
              <button
                key={goal.id}
                onClick={() => setSelectedId(goal.id)}
                className={`bg-ink-900 px-3 py-2 text-left ${selected?.id === goal.id ? "border-l-2 border-accent" : "border-l-2 border-transparent"}`}
              >
                <div className="font-mono text-[12px] text-ink-100">{goal.clock}</div>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-ink-400">
                  <span className="h-1.5 w-1.5" style={{ background: TEAM_COLORS[goal.scoring_side] }} />
                  {goal.scoring_team} · {goal.home_score}–{goal.away_score}
                </div>
              </button>
            ))}
          </div>
          {analysis.loading && <div className="px-4 py-6"><Loading label="Analyzing goal context" /></div>}
          {analysis.error && <div className="p-4"><ErrorNote error={analysis.error} /></div>}
          {analysis.data && (
            <>
              <div className="grid gap-3 px-4 py-3 md:grid-cols-4">
                <div><div className="label">Scored by</div><div className="mt-1 text-[13px]">{analysis.data.goal.scoring_team}</div></div>
                <div><div className="label">Conceded by</div><div className="mt-1 text-[13px]">{analysis.data.goal.conceding_team}</div></div>
                <div><div className="label">Context</div><div className="mt-1 text-[13px]">P{analysis.data.goal.period} · {clock(analysis.data.window_start_s)}–{analysis.data.goal.clock}</div></div>
                <div><div className="label">Phase / pattern</div><div className="mt-1 text-[13px]">{analysis.data.phase ?? "—"} · {analysis.data.pattern_label ?? (analysis.data.pattern_cluster === null ? "—" : `Cluster ${analysis.data.pattern_cluster + 1}`)}</div></div>
              </div>
              <FactorList title={`Possible weaknesses · ${analysis.data.goal.conceding_team}`} factors={analysis.data.conceding_factors} empty="No strong metric deviation was detected." />
              <FactorList title={`Attacking signals · ${analysis.data.goal.scoring_team}`} factors={analysis.data.attacking_factors} empty="No strong attacking deviation was detected." />
            </>
          )}
        </>
      )}
    </section>
  );
}