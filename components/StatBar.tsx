const MAX_STAT = 255;

export default function StatBar({
  label,
  abbreviation,
  value,
  color,
  hint,
}: {
  label: string;
  abbreviation: string;
  value: number;
  color: string;
  hint?: string;
}) {
  const pct = Math.max(1.5, (value / MAX_STAT) * 100);

  return (
    <div className="grid grid-cols-[3.5rem_2.75rem_1fr] items-center gap-3">
      <span
        className="font-mono text-[11px] uppercase tracking-widest text-[var(--muted)]"
        title={hint}
      >
        {abbreviation}
      </span>
      <span className="text-right font-mono text-sm tabular-nums text-[var(--foreground)]">
        {value}
      </span>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-raised)]">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}99, ${color})`,
          }}
          role="meter"
          aria-label={label}
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={MAX_STAT}
        />
      </div>
    </div>
  );
}
