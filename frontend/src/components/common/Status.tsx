import type { ReactNode } from "react";

export function Loading({ label = "LOADING", progress }: { label?: string; progress?: number }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="label text-ink-300">
        {label}
        {progress !== undefined && <span className="ml-2 value">{Math.round(progress * 100)}%</span>}
      </span>
      <div className="relative h-px w-28 overflow-hidden bg-ink-700">
        {progress === undefined ? (
          <div className="progress-indeterminate absolute inset-y-0 w-1/3 bg-accent" />
        ) : (
          <div className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${progress * 100}%` }} />
        )}
      </div>
    </div>
  );
}

export function Empty({ label = "—" }: { label?: string }) {
  return <div className="label py-6 text-center text-ink-500">{label}</div>;
}

export function ErrorNote({ error }: { error: Error }) {
  return <div className="border-l-2 border-away px-3 py-2 text-[12px] text-ink-200">{error.message}</div>;
}

export function Centered({ children }: { children: ReactNode }) {
  return <div className="flex h-full w-full items-center justify-center">{children}</div>;
}
