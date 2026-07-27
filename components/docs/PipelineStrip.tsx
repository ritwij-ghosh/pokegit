"use client";

import { useEffect, useState } from "react";

import {
  DOCS_PIPELINE_STAGES,
  type DocsPipelineStageId,
} from "@/lib/docs-catalog";

const HIGHLIGHT_MS = 1400;

export default function PipelineStrip() {
  const [active, setActive] = useState<DocsPipelineStageId | null>(null);

  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => setActive(null), HIGHLIGHT_MS);
    return () => window.clearTimeout(timer);
  }, [active]);

  function goTo(id: DocsPipelineStageId) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
    el.classList.add("docs-section-flash");
    window.setTimeout(() => el.classList.remove("docs-section-flash"), HIGHLIGHT_MS);
  }

  return (
    <nav aria-label="Scoring pipeline" className="w-full">
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-2">
        {DOCS_PIPELINE_STAGES.map((stage, index) => (
          <li key={stage.id} className="min-w-0">
            <button
              type="button"
              onClick={() => goTo(stage.id)}
              className={`gba-btn flex h-full w-full flex-col items-start gap-1 px-2.5 py-2.5 text-left transition-colors sm:px-3 ${
                active === stage.id
                  ? "bg-[var(--accent-soft)]"
                  : "hover:bg-[var(--surface-raised)]"
              }`}
            >
              <span className="font-display text-[0.45rem] uppercase tracking-wider text-[var(--muted)]">
                {String(index + 1).padStart(2, "0")}
                {index < DOCS_PIPELINE_STAGES.length - 1 ? " →" : ""}
              </span>
              <span className="font-display text-[0.55rem] uppercase leading-none text-[var(--foreground)]">
                {stage.label}
              </span>
              <span className="font-card text-xs leading-snug tracking-normal text-[var(--muted)]">
                {stage.short}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
