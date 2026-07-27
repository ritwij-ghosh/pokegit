"use client";

import { useMemo, useState } from "react";

import { TypeBadge, TypeChip } from "@/components/TypeSymbol";
import { COPY } from "@/lib/copy";
import {
  SIGNAL_CATEGORY_META,
  defaultMoveForCategory,
  formatMoveThreshold,
  formatSignalLabel,
  moveLaddersByCategory,
} from "@/lib/docs-catalog";
import type { SignalCategory } from "@/lib/moves";

export default function MoveExplorer() {
  const [category, setCategory] = useState<SignalCategory>("commit_timing");
  const ladders = useMemo(() => moveLaddersByCategory(category), [category]);
  const [signal, setSignal] = useState(ladders[0]?.signal ?? "");

  const activeSignal = ladders.some((l) => l.signal === signal)
    ? signal
    : (ladders[0]?.signal ?? "");
  const activeLadder = ladders.find((l) => l.signal === activeSignal);
  const fallback = defaultMoveForCategory(category);

  return (
    <div className="space-y-4">
      <p className="font-card text-sm leading-relaxed tracking-normal text-[var(--muted)]">
        {COPY.docs.movesRule}
      </p>

      <div className="flex flex-wrap gap-2">
        {SIGNAL_CATEGORY_META.map((meta) => (
          <button
            key={meta.id}
            type="button"
            onClick={() => {
              setCategory(meta.id);
              const next = moveLaddersByCategory(meta.id);
              setSignal(next[0]?.signal ?? "");
            }}
            className={`gba-select border-2 px-2.5 py-1.5 font-display text-[0.45rem] uppercase tracking-wider ${
              category === meta.id
                ? "border-[var(--ink)] bg-[var(--accent)] text-[var(--accent-contrast)]"
                : "border-[var(--border)] bg-[var(--surface-raised)] text-[var(--muted)] hover:border-[var(--ink)]"
            }`}
          >
            {meta.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {ladders.map((ladder) => (
          <button
            key={ladder.signal}
            type="button"
            onClick={() => setSignal(ladder.signal)}
            className={`gba-select inline-flex items-center gap-2 border-2 px-2 py-1 text-left ${
              activeSignal === ladder.signal
                ? "border-[var(--ink)] bg-[var(--surface-raised)]"
                : "border-[var(--border)] hover:border-[var(--ink)]"
            }`}
          >
            <TypeChip type={ladder.type} />
            <span className="font-card text-sm tracking-normal text-[var(--foreground)]">
              {formatSignalLabel(ladder.signal)}
            </span>
          </button>
        ))}
      </div>

      {activeLadder && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={activeLadder.type} />
            <h3 className="font-display text-[0.55rem] uppercase text-[var(--foreground)]">
              {formatSignalLabel(activeLadder.signal)}
            </h3>
          </div>

          <ol className="space-y-2">
            {activeLadder.tiers.map((move, index) => (
              <li
                key={move.id}
                className="relative border-2 border-[var(--border)] bg-[var(--surface)] px-3 py-3"
              >
                {index < activeLadder.tiers.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute -bottom-2 left-6 z-10 font-display text-[0.4rem] text-[var(--muted)]"
                  >
                    ↓
                  </span>
                )}
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-[0.45rem] text-[var(--muted)]">
                      T{move.tier}
                    </span>
                    <span className="font-display text-[0.55rem] uppercase text-[var(--foreground)]">
                      {move.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-card text-sm tabular-nums tracking-normal text-[var(--muted)]">
                    <span>pwr {move.power}</span>
                    <span>{formatMoveThreshold(move)}</span>
                  </div>
                </div>
                <p className="mt-2 font-card text-sm leading-relaxed tracking-normal text-[var(--muted)]">
                  {move.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="border-2 border-dashed border-[var(--border)] px-3 py-3">
        <p className="mb-1 font-display text-[0.45rem] uppercase tracking-wider text-[var(--muted)]">
          {COPY.docs.moveDefaultLabel}
        </p>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-display text-[0.55rem] uppercase text-[var(--foreground)]">
            {fallback.name}
          </span>
          <span className="font-card text-sm tracking-normal text-[var(--muted)]">
            Normal · pwr {fallback.power}
          </span>
        </div>
        <p className="mt-2 font-card text-sm leading-relaxed tracking-normal text-[var(--muted)]">
          {fallback.description}
        </p>
      </div>
    </div>
  );
}
