import type { ReactNode } from "react";
import { X } from "lucide-react";
import { useState } from "react";
import { useAppState } from "@/app/providers/AppStateProvider";
import { ErrorNote, Loading } from "@/components/common/Status";
import { runAnalysis } from "@/services/patterns";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-[12px] text-ink-300">{label}</span>
      {children}
    </label>
  );
}

const inputCls = "h-7 w-20 border border-ink-600 bg-ink-850 px-2 text-right font-mono text-[12px] text-ink-100 focus:border-accent focus:outline-none";

/** Temporal window / clustering configuration. ANALYZE re-runs discovery on the server. */
export function SettingsPopover({ onClose }: { onClose: () => void }) {
  const { matchId, analysis, setAnalysis } = useAppState();
  const [windowS, setWindowS] = useState(analysis.window_s);
  const [stepS, setStepS] = useState(analysis.step_s);
  const [k, setK] = useState<string>(analysis.k ? String(analysis.k) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submit = async () => {
    if (!matchId) return;
    const params = { window_s: windowS, step_s: stepS, k: k ? Number(k) : null };
    setBusy(true);
    setError(null);
    try {
      await runAnalysis(matchId, params);
      setAnalysis(params);
      onClose();
    } catch (e) {
      setError(e as Error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fade-in absolute right-4 top-12 z-50 w-72 border border-ink-600 bg-ink-900 shadow-2xl">
      <div className="flex items-center justify-between border-b border-ink-700 px-4 py-2.5">
        <span className="label text-ink-200">Analysis</span>
        <button className="icon-btn -mr-2" onClick={onClose} aria-label="Close">
          <X size={14} />
        </button>
      </div>
      <div className="px-4 py-2">
        <Field label="Window (s)">
          <input type="number" min={2} max={30} step={0.5} value={windowS} onChange={(e) => setWindowS(Number(e.target.value))} className={inputCls} />
        </Field>
        <Field label="Step (s)">
          <input type="number" min={0.2} max={windowS} step={0.2} value={stepS} onChange={(e) => setStepS(Number(e.target.value))} className={inputCls} />
        </Field>
        <Field label="Clusters (k)">
          <input type="number" min={2} max={12} placeholder="auto" value={k} onChange={(e) => setK(e.target.value)} className={inputCls} />
        </Field>
        {error && <div className="mt-2"><ErrorNote error={error} /></div>}
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-ink-700 px-4 py-2.5">
        {busy ? (
          <Loading label="Analyzing" />
        ) : (
          <>
            <button className="btn" onClick={() => { setWindowS(5); setStepS(1); setK(""); }}>Reset</button>
            <button className="btn btn-accent" onClick={submit}>Analyze</button>
          </>
        )}
      </div>
    </div>
  );
}
