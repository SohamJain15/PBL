import type { Quality } from "@/types/match";
import { pct, thousands } from "@/utils/formatting";

/** Stacked bar of player observations: detected / extrapolated / missing. */
export function QualityBar({ q }: { q: Quality }) {
  const total = q.detected + q.extrapolated + q.missing || 1;
  const parts = [
    { key: "Detected", v: q.detected, cls: "bg-ink-200" },
    { key: "Extrapolated", v: q.extrapolated, cls: "bg-ink-500" },
    { key: "Missing", v: q.missing, cls: "bg-[repeating-linear-gradient(135deg,#30353b_0_3px,#1a1d21_3px_6px)]" },
  ];
  return (
    <div>
      <div className="flex h-1.5 w-full overflow-hidden bg-ink-800">
        {parts.map((p) => (
          <div key={p.key} className={p.cls} style={{ width: `${(p.v / total) * 100}%` }} />
        ))}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {parts.map((p) => (
          <div key={p.key}>
            <div className="flex items-center gap-1.5">
              <span className={`inline-block h-1.5 w-1.5 ${p.cls}`} />
              <span className="text-[10px] uppercase tracking-[0.08em] text-ink-400">{p.key}</span>
            </div>
            <div className="value mt-0.5 text-[12px]">{pct(p.v / total)}</div>
            <div className="font-mono text-[10px] text-ink-500">{thousands(p.v)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
