import { useAppState } from "@/app/providers/AppStateProvider";
import { StripMetric } from "@/components/analysis/MetricRow";
import { InfoTip } from "@/components/common/InfoTip";
import { Segmented } from "@/components/common/Segmented";
import { useFrameTime } from "@/hooks/usePlayback";
import type { RangeFeatures } from "@/types/features";
import type { MatchDetail, Side } from "@/types/match";
import { num } from "@/utils/formatting";
import { TEAM_COLORS } from "@/utils/patternStyle";
import { shapeAt } from "./shapeAt";

export const COMPACTNESS_DEF =
  "C = 1 − S / R. S (stretch index) = mean distance of outfield players to their centroid; R = half the pitch diagonal. 0–1, higher = tighter block.";

/** Live team-shape strip under the pitch, updated per provider frame. */
export function MetricStrip({ match, features }: { match: MatchDetail; features: RangeFeatures | null }) {
  const { overlays, setOverlays } = useAppState();
  const t = useFrameTime(match.fps);
  const side = overlays.shapeSide;
  const s = shapeAt(features, side, t);
  return (
    <div className="flex h-10 items-center gap-7 border-t border-ink-700 bg-ink-900 px-4">
      <Segmented<Side>
        size="xs"
        value={side}
        onChange={(v) => setOverlays({ shapeSide: v })}
        options={[
          { value: "home", label: match.home.acronym },
          { value: "away", label: match.away.acronym },
        ]}
      />
      <span className="h-2 w-2" style={{ background: TEAM_COLORS[side] }} />
      <StripMetric label="Width" value={num(s?.width)} unit="m" />
      <StripMetric label="Depth" value={num(s?.depth)} unit="m" />
      <StripMetric label="Area" value={num(s?.area, 0)} unit="m²" />
      <StripMetric label="Compactness" value={num(s?.compactness, 2)} info={<InfoTip>{COMPACTNESS_DEF}</InfoTip>} />
      <StripMetric label="≤10 m ball" value={num(s?.near10, 0)} />
    </div>
  );
}
