import CalcHint from "@/components/CalcHint";

const MAX_STAT = 255;

/**
 * Data-dense row, so it stays on the light-touch end of the theme: no hard
 * shadow, no thick frame. The pixel read comes from the square track and the
 * notch overlay, which chops the fill into discrete cells.
 */
export default function StatBar({
  label,
  abbreviation,
  value,
  hint,
  /** Any CSS color. Defaults to the profile's per-theme identity color. */
  color = "var(--type)",
}: {
  label: string;
  abbreviation: string;
  value: number;
  /** Shown in a hover box explaining how the value was derived. */
  hint?: string;
  color?: string;
}) {
  const pct = Math.max(1.5, (value / MAX_STAT) * 100);

  const row = (
    <div className="grid grid-cols-[3.75rem_2.75rem_1fr] items-center gap-3">
      <span className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
        {abbreviation}
      </span>
      <span className="text-right text-sm tabular-nums text-[var(--foreground)]">
        {value}
      </span>
      <div className="relative h-3 border-2 border-[var(--border)] bg-[var(--surface-raised)]">
        <div
          className="h-full transition-[width] duration-700"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, color-mix(in srgb, ${color} 72%, transparent), ${color})`,
          }}
          role="meter"
          aria-label={hint ? `${label}. ${hint}` : label}
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={MAX_STAT}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent 0 5px, var(--surface) 5px 6px)",
            opacity: 0.55,
          }}
        />
      </div>
    </div>
  );

  if (!hint) return row;

  return <CalcHint hint={hint}>{row}</CalcHint>;
}
