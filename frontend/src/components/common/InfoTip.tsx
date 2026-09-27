import { Info } from "lucide-react";
import { useState, type ReactNode } from "react";

/** Hover tooltip for metric definitions. */
export function InfoTip({ children, align = "left" }: { children: ReactNode; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex align-middle"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
    >
      <Info size={11} className="text-ink-500 hover:text-ink-300" />
      {open && (
        <span
          className={`fade-in absolute top-5 z-50 w-64 border border-ink-600 bg-ink-850 px-3 py-2 text-[11px] font-normal normal-case leading-relaxed tracking-normal text-ink-200 shadow-xl ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children}
        </span>
      )}
    </span>
  );
}
