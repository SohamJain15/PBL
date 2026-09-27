interface Option<T> {
  value: T;
  label: string;
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  size = "sm",
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  size?: "xs" | "sm";
}) {
  const h = size === "xs" ? "h-6 px-2 text-[10px]" : "h-7 px-2.5 text-[11px]";
  return (
    <div className="inline-flex border border-ink-600 bg-ink-900">
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={`${h} whitespace-nowrap font-medium uppercase tracking-[0.08em] transition-colors ${
            o.value === value ? "bg-ink-700 text-ink-100" : "text-ink-400 hover:text-ink-200"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
