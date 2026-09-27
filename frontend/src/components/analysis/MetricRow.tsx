import type { ReactNode } from "react";

/** Two-team comparison row: label | home value | away value. */
export function CompareRow({
  label,
  home,
  away,
  unit,
  info,
}: {
  label: string;
  home: string;
  away: string;
  unit?: string;
  info?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[1fr_64px_64px] items-baseline py-[3px]">
      <span className="flex items-center gap-1.5 text-[12px] text-ink-300">
        {label}
        {info}
      </span>
      <span className="value text-right text-[12px]">
        {home}
        {unit && home !== "—" && <span className="ml-0.5 text-[10px] text-ink-500">{unit}</span>}
      </span>
      <span className="value text-right text-[12px]">
        {away}
        {unit && away !== "—" && <span className="ml-0.5 text-[10px] text-ink-500">{unit}</span>}
      </span>
    </div>
  );
}

/** Horizontal label/value pair for analytic strips. */
export function StripMetric({ label, value, unit, info }: { label: string; value: string; unit?: string; info?: ReactNode }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="label flex items-center gap-1">
        {label}
        {info}
      </span>
      <span className="value text-[13px]">
        {value}
        {unit && value !== "—" && <span className="ml-0.5 text-[10px] text-ink-500">{unit}</span>}
      </span>
    </div>
  );
}
