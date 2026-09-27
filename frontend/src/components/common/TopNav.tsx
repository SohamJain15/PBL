import { Settings } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAppState } from "@/app/providers/AppStateProvider";
import { useMatch, useMatches } from "@/hooks/useMatch";
import { SettingsPopover } from "@/features/analysis/SettingsPopover";

const NAV = [
  { to: "/match", label: "Match" },
  { to: "/patterns", label: "Patterns" },
  { to: "/analysis", label: "Analysis" },
];

export function TopNav() {
  const { data: matches } = useMatches();
  const { data: match } = useMatch();
  const { analysis } = useAppState();
  const [open, setOpen] = useState(false);
  const tracked = (matches ?? []).filter((m) => m.tracking_available).length;

  return (
    <header className="relative flex h-11 shrink-0 items-center border-b border-ink-700 bg-ink-950 px-4">
      <div className="flex items-baseline gap-3 pr-8">
        <span className="text-[13px] font-semibold tracking-[0.2em]">TACTICAL LAB</span>
        <span className="text-[11px] text-ink-400">Spatiotemporal Pattern Mining</span>
      </div>
      <nav className="flex h-full items-stretch">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) =>
              `flex items-center border-b-2 px-4 text-[11px] font-medium uppercase tracking-[0.12em] transition-colors ${
                isActive ? "border-accent text-ink-100" : "border-transparent text-ink-400 hover:text-ink-200"
              }`
            }
          >
            {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-5 text-[11px]">
        <span className="flex items-center gap-2 text-ink-400" title="SkillCorner Open Data — matches with downloaded tracking">
          <span className={`h-1.5 w-1.5 rounded-full ${tracked ? "bg-[#7fb77e]" : "bg-away"}`} />
          SkillCorner Open Data
          <span className="font-mono text-ink-300">
            {tracked}/{matches?.length ?? 0}
          </span>
        </span>
        {match && (
          <span className="font-mono text-ink-200">
            {match.home.acronym} {match.home_score}–{match.away_score} {match.away.acronym}
          </span>
        )}
        <span className="font-mono text-ink-500">
          W{analysis.window_s}s · S{analysis.step_s}s · k={analysis.k ?? "auto"}
        </span>
        <button className="icon-btn" onClick={() => setOpen((o) => !o)} aria-label="Analysis settings">
          <Settings size={15} />
        </button>
      </div>
      {open && <SettingsPopover onClose={() => setOpen(false)} />}
    </header>
  );
}
