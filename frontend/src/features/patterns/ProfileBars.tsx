import type { FeatureStat } from "@/types/patterns";
import { num, signed } from "@/utils/formatting";

const Z_CLAMP = 2.5;

/** Diverging bars of cluster-mean z-scores (relative to all windows of the match). */
export function ProfileBars({ profile, limit, color }: { profile: FeatureStat[]; limit?: number; color: string }) {
  const rows = limit ? [...profile].sort((a, b) => Math.abs(b.z) - Math.abs(a.z)).slice(0, limit) : profile;
  return (
    <div className="flex flex-col gap-1">
      {rows.map((f) => {
        const w = (Math.min(Math.abs(f.z), Z_CLAMP) / Z_CLAMP) * 50;
        return (
          <div key={f.key} className="grid grid-cols-[112px_1fr_56px] items-center gap-2">
            <span className="truncate text-[11px] text-ink-300" title={f.label}>{f.label}</span>
            <div className="relative h-2 bg-ink-850">
              <span className="absolute inset-y-0 left-1/2 w-px bg-ink-600" />
              <span
                className="absolute inset-y-0"
                style={{ background: color, opacity: 0.85, left: f.z >= 0 ? "50%" : `${50 - w}%`, width: `${w}%` }}
              />
            </div>
            <span className="text-right font-mono text-[10px] text-ink-400" title={`mean ${num(f.mean, 2)} ${f.unit}`}>
              {signed(f.z, 2)}σ
            </span>
          </div>
        );
      })}
    </div>
  );
}
