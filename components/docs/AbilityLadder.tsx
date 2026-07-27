"use client";

import { useState } from "react";

import type { AbilityDoc } from "@/lib/abilities";
import { COPY } from "@/lib/copy";

export default function AbilityLadder({ abilities }: { abilities: AbilityDoc[] }) {
  const [open, setOpen] = useState<number | null>(1);

  return (
    <div className="space-y-3">
      <p className="border-l-4 border-[var(--accent)] bg-[var(--accent-soft)] px-3 py-2 text-xs leading-relaxed text-[var(--foreground)]">
        {COPY.docs.abilityRule}
      </p>

      <ol className="relative space-y-0 border-l-2 border-[var(--border)] pl-0">
        {abilities.map((ability, index) => {
          const isOpen = open === ability.priority;
          const isLast = index === abilities.length - 1;
          return (
            <li key={ability.name} className="relative pl-6">
              <span
                aria-hidden
                className="absolute left-0 top-4 h-2.5 w-2.5 -translate-x-[calc(50%+1px)] border-2 border-[var(--ink)] bg-[var(--accent)]"
              />
              <button
                type="button"
                onClick={() =>
                  setOpen((current) =>
                    current === ability.priority ? null : ability.priority,
                  )
                }
                className={`mb-2 w-full border-2 px-3 py-2.5 text-left transition-colors ${
                  isOpen
                    ? "border-[var(--ink)] bg-[var(--surface-raised)]"
                    : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--ink)]"
                }`}
                aria-expanded={isOpen}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-display text-[0.5rem] tabular-nums text-[var(--muted)]">
                    #{String(ability.priority).padStart(2, "0")}
                  </span>
                  <span className="flex-1 font-display text-[0.55rem] uppercase text-[var(--foreground)]">
                    {ability.name}
                  </span>
                  <span className="font-display text-[0.45rem] text-[var(--muted)]">
                    {isOpen ? "−" : "+"}
                  </span>
                </div>
                {isOpen && (
                  <div className="mt-3 space-y-2 border-t border-[var(--border)] pt-3">
                    <p className="text-xs leading-relaxed text-[var(--muted)]">
                      {ability.description}
                    </p>
                    <div>
                      <p className="mb-1 font-display text-[0.45rem] uppercase tracking-wider text-[var(--muted)]">
                        {COPY.docs.abilityExpand}
                      </p>
                      <p className="text-xs leading-relaxed text-[var(--foreground)]">
                        {ability.condition}
                      </p>
                    </div>
                    {!isLast && (
                      <p className="font-display text-[0.4rem] uppercase tracking-wider text-[var(--muted)]">
                        else check next ↓
                      </p>
                    )}
                  </div>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
