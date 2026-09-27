import type { ReactNode } from "react";

export function Section({
  title,
  right,
  children,
  className = "",
}: {
  title: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`border-b border-ink-700 px-4 py-3 ${className}`}>
      <header className="mb-2.5 flex h-4 items-center justify-between">
        <h3 className="label">{title}</h3>
        {right}
      </header>
      {children}
    </section>
  );
}
