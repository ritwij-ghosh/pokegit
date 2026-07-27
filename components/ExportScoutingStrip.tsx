import {
  topScoutingMetrics,
  type ShareCardStats,
} from "@/lib/share-posts";

export function ExportScoutingStrip({
  stats,
  className = "export-scout",
  count = 4,
}: {
  stats: ShareCardStats;
  className?: string;
  count?: number;
}) {
  const metrics = topScoutingMetrics(stats, count);
  if (metrics.length === 0) return null;

  return (
    <div className={className}>
      <p className={`${className}__heading`}>Scouting metrics</p>
      <div className={`${className}__grid`}>
        {metrics.map((metric) => (
          <div key={metric.label} className={`${className}__item`}>
            <span className={`${className}__value`}>{metric.display}</span>
            <span className={`${className}__label`}>{metric.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
