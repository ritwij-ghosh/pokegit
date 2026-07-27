import { COPY } from "@/lib/copy";

const STATS: { key: keyof typeof COPY.profile.statHints; label: string }[] = [
  { key: "hp", label: "HP" },
  { key: "attack", label: "Attack" },
  { key: "defense", label: "Defense" },
  { key: "spAttack", label: "Sp. Atk" },
  { key: "spDefense", label: "Sp. Def" },
  { key: "speed", label: "Speed" },
];

export default function StatReference() {
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {STATS.map((stat) => (
        <div
          key={stat.key}
          className="border-2 border-[var(--border)] bg-[var(--surface)] px-3 py-3"
        >
          <dt className="font-display text-[0.55rem] uppercase text-[var(--foreground)]">
            {stat.label}
          </dt>
          <dd className="mt-2 font-card text-sm leading-relaxed tracking-normal text-[var(--muted)]">
            {COPY.profile.statHints[stat.key]}
          </dd>
        </div>
      ))}
      <div className="border-2 border-[var(--border)] bg-[var(--accent-soft)] px-3 py-3 sm:col-span-2">
        <dt className="font-display text-[0.55rem] uppercase text-[var(--foreground)]">
          {COPY.profile.bstLabel}
        </dt>
        <dd className="mt-2 font-card text-sm leading-relaxed tracking-normal text-[var(--muted)]">
          {COPY.profile.bstHint} Each stat uses a log curve clamped to 1–255.
        </dd>
      </div>
    </dl>
  );
}
