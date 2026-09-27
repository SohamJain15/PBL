import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { usePlaybackSelector } from "@/app/providers/PlaybackProvider";
import { InfoTip } from "@/components/common/InfoTip";
import type { MatchDetail } from "@/types/match";
import type { EpisodeDetail, FeatureChange } from "@/types/patterns";
import { clockShort, num, signed } from "@/utils/formatting";
import { clusterCode, patternColor, TEAM_COLORS } from "@/utils/patternStyle";
import { ProfileBars } from "./ProfileBars";

const PHASES = ["Before", "During", "After"] as const;

function ReplayPhase({ start, end, before, after }: { start: number; end: number; before: number; after: number }) {
  const time = usePlaybackSelector((s) => s.time);
  const active = time < start ? 0 : time <= end ? 1 : 2;
  const total = end - start + before + after;
  const progress = Math.min(1, Math.max(0, (time - (start - before)) / total));
  return (
    <div>
      <div className="grid grid-cols-3 gap-px">
        {PHASES.map((p, i) => (
          <span
            key={p}
            className={`py-1 text-center text-[10px] font-medium uppercase tracking-[0.1em] transition-colors ${
              i === active ? "bg-ink-700 text-ink-100" : "bg-ink-850 text-ink-500"
            }`}
          >
            {p}
          </span>
        ))}
      </div>
      <div className="mt-px h-px bg-ink-800">
        <div className="h-px bg-accent" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}

function digits(c: FeatureChange) {
  return c.key === "compactness" ? 3 : c.key === "area" ? 0 : 1;
}

function ChangeRow({ c }: { c: FeatureChange }) {
  const d = c.start !== null && c.end !== null ? c.end - c.start : null;
  return (
    <div className="grid grid-cols-[1fr_auto_64px] items-baseline gap-2 py-[3px]">
      <span className="text-[12px] text-ink-300">{c.label}</span>
      <span className="value text-[12px]">
        {num(c.start, digits(c))}
        <span className="mx-1.5 text-ink-500">→</span>
        {num(c.end, digits(c))}
        {c.unit && <span className="ml-0.5 text-[10px] text-ink-500">{c.unit}</span>}
      </span>
      <span className={`text-right font-mono text-[11px] ${d === null ? "text-ink-500" : "text-ink-300"}`}>{signed(d, digits(c))}</span>
    </div>
  );
}

export function PatternDetailPanel({
  detail, match, demo, onClose,
}: { detail: EpisodeDetail; match: MatchDetail; demo: boolean; onClose: () => void }) {
  const { episode: ep, cluster: c } = detail;
  const color = patternColor(c.interpretation.label, c.id);
  const team = match[ep.side];
  const oop = c.profile.find((f) => f.key === "possession_share");
  return (
    <div className="fade-in border-b border-ink-700">
      <div className="flex items-center justify-between px-4 pt-3">
        <span className="label flex items-center gap-2">
          Pattern
          {demo && <span className="border border-accent-dim px-1.5 py-px text-[9px] text-accent">Demo sequence</span>}
        </span>
        <button className="icon-btn -mr-2 h-6 w-6" onClick={onClose} aria-label="Clear pattern">
          <X size={13} />
        </button>
      </div>
      <div className="px-4 pb-3 pt-1.5">
        <div className="flex items-center gap-2.5">
          <span className="h-3 w-3" style={{ background: color }} />
          <span className="text-[17px] font-medium leading-tight">{c.interpretation.label ?? "Unlabelled pattern"}</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] text-ink-500">
          {c.interpretation.label ? "Tactical interpretation" : "No interpretation rule matched"}
          <InfoTip>
            A rule-based reading of the cluster's mean feature profile. The clustering model itself has no notion of
            tactics. Matched rules: {c.interpretation.rules_matched.join(", ") || "none"}.
          </InfoTip>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
          <div>
            <div className="label">Discovery</div>
            <div className="value mt-0.5 text-[13px]">Cluster {clusterCode(c.id).slice(1)}</div>
          </div>
          <div>
            <div className="label">Team</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[13px]">
              <span className="h-2 w-2" style={{ background: TEAM_COLORS[ep.side] }} />
              {team.acronym}
              <span className="text-[11px] text-ink-500">{ep.side}</span>
            </div>
          </div>
          <div>
            <div className="label">Occurrences</div>
            <div className="value mt-0.5 text-[13px]">{c.n_episodes}</div>
          </div>
          <div>
            <div className="label">Avg duration</div>
            <div className="value mt-0.5 text-[13px]">{c.avg_duration_s.toFixed(1)}s</div>
          </div>
          <div>
            <div className="label">This sequence</div>
            <div className="value mt-0.5 text-[13px]">
              {clockShort(ep.start_s)}–{clockShort(ep.end_s)}
              <span className="ml-1.5 text-[11px] text-ink-400">{ep.duration_s.toFixed(1)}s</span>
            </div>
          </div>
          <div>
            <div className="label">In possession</div>
            <div className="value mt-0.5 text-[13px]">{oop ? `${Math.round(oop.mean * 100)}%` : "—"}</div>
          </div>
        </div>

        <div className="mt-3">
          <ReplayPhase start={ep.start_s} end={ep.end_s} before={detail.context_before_s} after={detail.context_after_s} />
        </div>
      </div>

      <div className="border-t border-ink-800 px-4 py-3">
        <div className="label mb-1.5 flex items-center gap-1.5">
          Why grouped here
          <InfoTip>
            Measured on this sequence: mean of the first second → mean of the last second, from the tracking data of the{" "}
            {team.acronym} outfield players.
          </InfoTip>
        </div>
        {detail.changes.map((ch) => (
          <ChangeRow key={ch.key} c={ch} />
        ))}
      </div>

      <div className="border-t border-ink-800 px-4 py-3">
        <div className="label mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            Cluster profile
            <InfoTip>Cluster-mean z-scores relative to all team-windows of this match (both teams). Top 6 by magnitude.</InfoTip>
          </span>
          <Link to="/patterns" className="text-[10px] text-ink-400 hover:text-accent">
            Patterns →
          </Link>
        </div>
        <ProfileBars profile={c.profile} limit={6} color={color} />
      </div>
    </div>
  );
}
