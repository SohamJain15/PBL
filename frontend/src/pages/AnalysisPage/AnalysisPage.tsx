import { InfoTip } from "@/components/common/InfoTip";
import { Centered, ErrorNote, Loading } from "@/components/common/Status";
import { PatternFrequency } from "@/features/analysis/PatternFrequency";
import { TeamShapeChart } from "@/features/analysis/TeamShapeChart";
import { HeatmapView } from "@/features/heatmaps/HeatmapView";
import { useMatch } from "@/hooks/useMatch";
import { usePatterns } from "@/hooks/usePatterns";
import type { ReactNode } from "react";

function Panel({ title, info, right, children, className = "" }: { title: string; info?: ReactNode; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`flex min-h-0 flex-col border-ink-700 ${className}`}>
      <header className="flex h-9 shrink-0 items-center justify-between border-b border-ink-700 px-4">
        <h2 className="label flex items-center gap-1.5 text-ink-200">
          {title}
          {info && <InfoTip>{info}</InfoTip>}
        </h2>
        {right}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

export function AnalysisPage() {
  const match = useMatch();
  const patterns = usePatterns(Boolean(match.data?.tracking_available));
  if (match.error) return <Centered><ErrorNote error={match.error} /></Centered>;
  if (!match.data) return <Centered><Loading /></Centered>;
  const m = match.data;
  return (
    <div className="scroll-thin h-full overflow-y-auto">
      <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] border-b border-ink-700" style={{ height: "min(56vh, 520px)" }}>
        <Panel title="Team shape over time" info="Outfield players only, 5 Hz samples averaged in 60 s bins. Gaps = no tracking (ball out of play / broadcast cuts)." className="border-r">
          <TeamShapeChart match={m} />
        </Panel>
        <Panel title="Occupancy">
          <HeatmapView match={m} />
        </Panel>
      </div>
      <div>
        <Panel title="Pattern frequency" info="Discovered sequences (merged consecutive windows) per cluster and team." right={patterns.data && <span className="font-mono text-[10px] text-ink-500">{patterns.data.episodes.length} sequences</span>}>
          <div className="h-[300px] p-2">{patterns.data ? <PatternFrequency d={patterns.data} match={m} /> : <Centered><Loading label="Analyzing" /></Centered>}</div>
        </Panel>
      </div>
    </div>
  );
}
