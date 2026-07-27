import type { Metadata } from "next";

import AbilityLadder from "@/components/docs/AbilityLadder";
import LanguageTypeTable from "@/components/docs/LanguageTypeTable";
import MoveExplorer from "@/components/docs/MoveExplorer";
import PipelineStrip from "@/components/docs/PipelineStrip";
import StatReference from "@/components/docs/StatReference";
import { TypeBadge } from "@/components/TypeSymbol";
import { ABILITY_DOCS } from "@/lib/abilities";
import { COPY } from "@/lib/copy";
import { ALL_POKEMON_TYPES } from "@/lib/docs-catalog";

export const metadata: Metadata = {
  title: "DEX — PokeGit",
  description:
    "Reference for how PokeGit maps GitHub activity to typing, stats, abilities, and moves.",
};

function DocsPanel({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="dex-panel scroll-mt-24">
      <h2
        className="flex items-center gap-2 border-b-2 border-[var(--border)] bg-[var(--surface-raised)]
                   px-4 py-2.5 font-display text-[0.55rem] uppercase text-[var(--foreground)]"
      >
        <span aria-hidden className="h-2.5 w-2.5 shrink-0 bg-[var(--accent)]" />
        {title}
      </h2>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export default function DocsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
      <section className="gba-panel px-5 py-7 sm:px-8 sm:py-9">
        <span
          className="inline-flex items-center gap-2 border-2 border-[var(--border)]
                     bg-[var(--surface-raised)] px-2.5 py-1 font-display text-[0.5rem]
                     uppercase tracking-wider text-[var(--muted)]"
        >
          <span className="h-2 w-2 bg-[var(--accent)]" />
          {COPY.docs.kicker}
        </span>
        <h1 className="mt-5 font-display text-sm uppercase leading-relaxed text-[var(--foreground)] sm:text-base">
          {COPY.docs.title}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-[1.9] text-[var(--muted)]">
          {COPY.docs.intro}
        </p>
        <p className="mt-4 text-xs leading-relaxed text-[var(--muted)]">
          {COPY.docs.pipelineLead}
        </p>
        <div className="mt-5">
          <PipelineStrip />
        </div>
      </section>

      <div className="mt-6 space-y-5">
        <DocsPanel id="typing" title={COPY.docs.sections.typing}>
          <p className="text-xs leading-relaxed text-[var(--muted)]">
            {COPY.docs.typingRule}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {ALL_POKEMON_TYPES.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-[var(--muted)]">
            {COPY.docs.hueFallback}
          </p>
          <div className="mt-6 border-t-2 border-[var(--border)] pt-5">
            <h3 className="mb-3 font-display text-[0.5rem] uppercase tracking-wider text-[var(--foreground)]">
              {COPY.docs.sections.languages}
            </h3>
            <LanguageTypeTable />
          </div>
        </DocsPanel>

        <DocsPanel id="stats" title={COPY.docs.sections.stats}>
          <StatReference />
        </DocsPanel>

        <DocsPanel id="ability" title={COPY.docs.sections.ability}>
          <AbilityLadder abilities={ABILITY_DOCS} />
        </DocsPanel>

        <DocsPanel id="moves" title={COPY.docs.sections.moves}>
          <MoveExplorer />
        </DocsPanel>

        <DocsPanel id="caveats" title={COPY.docs.sections.caveats}>
          <ul className="space-y-2">
            {COPY.docs.caveats.map((caveat) => (
              <li
                key={caveat}
                className="flex gap-2 text-xs leading-[1.9] text-[var(--muted)]"
              >
                <span aria-hidden className="text-[var(--accent)]">
                  -
                </span>
                {caveat}
              </li>
            ))}
          </ul>
        </DocsPanel>
      </div>
    </main>
  );
}
