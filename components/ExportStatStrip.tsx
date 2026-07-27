import type { ShareCardStats } from "@/lib/share-posts";

/** Full names — export-only; live profile cards keep abbreviations. */
const ROWS: { key: keyof ShareCardStats; label: string }[] = [
  { key: "hp", label: "HP" },
  { key: "attack", label: "Attack" },
  { key: "defense", label: "Defense" },
  { key: "spAttack", label: "Sp. Attack" },
  { key: "spDefense", label: "Sp. Defense" },
  { key: "speed", label: "Speed" },
];

export function ExportStatStrip({
  stats,
  className = "export-stats",
}: {
  stats: ShareCardStats;
  className?: string;
}) {
  return (
    <div className={className}>
      {ROWS.map((row) => {
        const value = Number(stats[row.key]);
        const pct = Math.min(100, Math.round((value / 255) * 100));
        return (
          <div key={row.key} className={`${className}__row`}>
            <span className={`${className}__label`}>{row.label}</span>
            <span className={`${className}__track`} aria-hidden="true">
              <span
                className={`${className}__fill`}
                style={{ width: `${pct}%` }}
              />
            </span>
            <span className={`${className}__value`}>{value}</span>
          </div>
        );
      })}
      <div className={`${className}__total`}>
        <span>Base Stat Total</span>
        <b>{stats.total}</b>
      </div>
    </div>
  );
}
