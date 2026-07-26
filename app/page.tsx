import UsernameForm from "@/components/UsernameForm";

const HIGHLIGHTS = [
  { label: "Six base stats", detail: "normalized 1–255 from real activity" },
  { label: "Dual typing", detail: "from the languages you actually write" },
  { label: "One of 25 abilities", detail: "picked by rules, not vibes" },
  { label: "Pokedex entry", detail: "written from your own numbers" },
];

export default function Home() {
  return (
    <main className="lattice relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-20">
      {/* Soft radial glow behind the hero. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[42rem] w-[42rem]
                   -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(74,222,128,0.16) 0%, rgba(8,9,13,0) 70%)",
        }}
      />

      <div className="relative w-full max-w-lg rise">
        <span
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)]
                     bg-[var(--surface)] px-3 py-1 font-mono text-[11px] uppercase
                     tracking-[0.18em] text-[var(--muted)]"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          github × pokedex
        </span>

        <h1 className="mt-6 text-6xl font-bold leading-[0.95] tracking-tight sm:text-7xl">
          Poke
          <span className="text-[var(--accent)]">Git</span>
        </h1>

        <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--muted)]">
          Every public GitHub profile is a species with observable habits. Enter
          a username to see its base stats, typing, ability and Pokedex entry.
        </p>

        <div className="mt-8">
          <UsernameForm autoFocus />
        </div>

        <dl className="mt-14 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          {HIGHLIGHTS.map((item) => (
            <div key={item.label} className="border-t border-[var(--border)] pt-3">
              <dt className="text-sm font-medium text-[var(--foreground)]">
                {item.label}
              </dt>
              <dd className="mt-0.5 text-xs leading-relaxed text-[var(--muted)]">
                {item.detail}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <footer className="relative mt-20 font-mono text-[11px] text-[var(--muted)]">
        no login · public data only · nothing stored
      </footer>
    </main>
  );
}
