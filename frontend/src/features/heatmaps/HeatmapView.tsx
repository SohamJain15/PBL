import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useAppState } from "@/app/providers/AppStateProvider";
import { FootballPitch } from "@/components/pitch/FootballPitch";
import { PitchSvg } from "@/components/pitch/PitchOverlay";
import { InfoTip } from "@/components/common/InfoTip";
import { Segmented } from "@/components/common/Segmented";
import { Loading } from "@/components/common/Status";
import { useAsync } from "@/hooks/useAsync";
import { fetchHeatmap } from "@/services/tracking";
import type { MatchDetail } from "@/types/match";
import { clockShort } from "@/utils/formatting";
import { HeatmapLayer, HeatmapLegend } from "./HeatmapLayer";

type SideOpt = "home" | "away" | "all";
type Scope = "match" | "p1" | "p2" | "window";

export function HeatmapView({ match }: { match: MatchDetail }) {
  const { window } = useAppState();
  const [side, setSide] = useState<SideOpt>("home");
  const [scope, setScope] = useState<Scope>("match");
  const useWindow = scope === "window" && window !== null;
  const period = useWindow ? window.period : scope === "p1" ? 1 : scope === "p2" ? 2 : null;
  const start = useWindow ? window.start : null;
  const end = useWindow ? window.end : null;
  const { data, loading } = useAsync(() => fetchHeatmap(match.id, side, period, start, end), [match.id, side, period, start, end]);
  const reference = side === "all" ? match.home.acronym : match[side].acronym;

  const scopes: { value: Scope; label: string }[] = [
    { value: "match", label: "Match" },
    { value: "p1", label: "P1" },
    { value: "p2", label: "P2" },
  ];
  if (window) scopes.push({ value: "window", label: `${clockShort(window.start)}–${clockShort(window.end)}` });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 py-2">
        <Segmented<SideOpt>
          size="xs"
          value={side}
          onChange={setSide}
          options={[
            { value: "home", label: match.home.acronym },
            { value: "away", label: match.away.acronym },
            { value: "all", label: "All" },
          ]}
        />
        <Segmented<Scope> size="xs" value={scope} onChange={setScope} options={scopes} />
        <span className="ml-auto flex items-center gap-4 whitespace-nowrap font-mono text-[10px] text-ink-400">
          <HeatmapLegend />
          <span className="flex items-center gap-1.5 whitespace-nowrap">
          {reference} attacking <ArrowRight size={11} />
          <InfoTip align="right">
            Share of time with a player in each {data?.bin_m ?? 2} m cell (all tracked positions, goalkeepers included),
            light Gaussian smoothing (σ = 1 cell). Positions are rotated so {reference} always attacks left → right,
            which lets both halves be pooled. {data ? `${data.samples.toLocaleString()} player positions.` : ""}
          </InfoTip>
          </span>
        </span>
      </div>
      <div className="relative min-h-0 flex-1 bg-[#1f3a27] p-2">
        {loading && !data && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <Loading />
          </div>
        )}
        <PitchSvg length={match.pitch_length} width={match.pitch_width}>
          <g filter="saturate(0.3) brightness(0.45)">
            <FootballPitch length={match.pitch_length} width={match.pitch_width} />
          </g>
          {data && <HeatmapLayer heatmap={data} />}
        </PitchSvg>
      </div>
    </div>
  );
}
