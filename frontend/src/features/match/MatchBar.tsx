import { ChevronDown, Play } from "lucide-react";
import { useAppState } from "@/app/providers/AppStateProvider";
import { Segmented } from "@/components/common/Segmented";
import { useMatches } from "@/hooks/useMatch";
import type { MatchDetail } from "@/types/match";
import { matchDate } from "@/utils/formatting";
import { TEAM_COLORS } from "@/utils/patternStyle";

export function MatchSelector() {
  const { matchId, setMatch } = useAppState();
  const { data: matches } = useMatches();
  return (
    <label className="relative inline-flex items-center">
      <select
        value={matchId ?? ""}
        onChange={(e) => setMatch(Number(e.target.value))}
        className="h-7 appearance-none border border-ink-600 bg-ink-850 pl-2.5 pr-8 text-[12px] text-ink-100 hover:border-ink-500 focus:outline-none"
      >
        {(matches ?? []).map((m) => (
          <option key={m.id} value={m.id} disabled={!m.metadata_available}>
            {m.home_team} v {m.away_team} · {m.date_time.slice(0, 10)}
            {m.tracking_available ? "" : "  (no tracking)"}
          </option>
        ))}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute right-2 text-ink-400" />
    </label>
  );
}

export function MatchBar({ match, demoAvailable, onDemo }: { match: MatchDetail; demoAvailable: boolean; onDemo: () => void }) {
  const { period, setPeriod, demo } = useAppState();
  const meta = [match.competition, match.round_name, matchDate(match.date_time), match.stadium, `ID ${match.id}`]
    .filter(Boolean)
    .join("  /  ");
  return (
    <div className="flex h-12 items-center gap-5 border-b border-ink-700 bg-ink-900 px-4">
      <MatchSelector />
      <div className="flex shrink-0 items-center gap-3 whitespace-nowrap">
        <span className="h-2.5 w-2.5" style={{ background: TEAM_COLORS.home }} />
        <span className="text-[13px] font-medium">{match.home.short_name}</span>
        <span className="value text-[15px] font-medium">
          {match.home_score ?? "–"}
          <span className="mx-1.5 text-ink-500">–</span>
          {match.away_score ?? "–"}
        </span>
        <span className="text-[13px] font-medium">{match.away.short_name}</span>
        <span className="h-2.5 w-2.5" style={{ background: TEAM_COLORS.away }} />
      </div>
      <div className="min-w-0 flex-1 truncate whitespace-nowrap text-[11px] text-ink-400" title={meta}>
        {meta}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Segmented<number>
          size="xs"
          value={period}
          onChange={setPeriod}
          options={match.periods.map((p) => ({ value: p.period, label: `P${p.period}` }))}
        />
        <button className={`btn whitespace-nowrap ${demo ? "btn-accent" : ""}`} onClick={onDemo} disabled={!demoAvailable} title="Replay an automatically selected real sequence">
          <Play size={11} /> Demo sequence
        </button>
      </div>
    </div>
  );
}
