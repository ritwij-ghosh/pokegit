"use client";

import { useEffect, useState } from "react";

import { COPY } from "@/lib/copy";

const CHAR_MS = 22;

type Props = {
  username: string;
  initial:
    | { status: "ready"; text: string; source: string }
    | { status: "pending" }
    | { status: "offline"; text: string };
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Shows a cached entry with a Pokédex-style typewriter, or in-theme pending
 * copy that polls until the fire-and-forget Groq write lands. Never triggers
 * generation itself.
 */
export default function PokedexEntryText({ username, initial }: Props) {
  const [state, setState] = useState(initial);
  const fullText =
    state.status === "ready" || state.status === "offline" ? state.text : null;
  const [visibleLength, setVisibleLength] = useState(0);

  useEffect(() => {
    if (state.status !== "pending") return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 20;

    async function poll() {
      attempts += 1;
      try {
        const res = await fetch(
          `/api/pokedex/${encodeURIComponent(username)}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const body = (await res.json()) as {
          status: string;
          text?: string;
          source?: string;
        };
        if (cancelled) return;
        if (body.status === "ready" && body.text) {
          setState({
            status: "ready",
            text: body.text,
            source: body.source ?? "cache",
          });
          return;
        }
      } catch {
        // ignore transient poll errors
      }

      if (!cancelled && attempts < maxAttempts) {
        window.setTimeout(poll, attempts < 5 ? 800 : 1500);
      }
    }

    const timer = window.setTimeout(poll, 600);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [username, state.status]);

  useEffect(() => {
    if (fullText == null) {
      setVisibleLength(0);
      return;
    }

    if (prefersReducedMotion()) {
      setVisibleLength(fullText.length);
      return;
    }

    setVisibleLength(0);
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      setVisibleLength(n);
      if (n >= fullText.length) window.clearInterval(id);
    }, CHAR_MS);

    return () => window.clearInterval(id);
  }, [username, fullText]);

  if (state.status === "pending") {
    return (
      <>
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="font-display text-[0.45rem] uppercase tracking-wider text-[var(--muted)]">
            {COPY.profile.entryLabel}
          </span>
          <span className="border border-[var(--border)] px-1.5 py-px text-[10px] text-[var(--muted)]">
            {COPY.profile.pendingBadge}
          </span>
        </div>
        <p className="text-xs leading-[1.85] text-[var(--muted)] sm:text-sm sm:leading-[1.9]">
          {COPY.profile.pendingEntry}
        </p>
      </>
    );
  }

  const showOffline =
    state.status === "offline" ||
    (state.status === "ready" && state.source === "fallback");
  const typing = visibleLength < state.text.length;

  return (
    <>
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <span className="font-display text-[0.45rem] uppercase tracking-wider text-[var(--muted)]">
          {COPY.profile.entryLabel}
        </span>
        {showOffline && (
          <span
            className="border border-[var(--border)] px-1.5 py-px text-[10px] text-[var(--muted)]"
            title={COPY.profile.offlineHint}
          >
            {COPY.profile.offlineBadge}
          </span>
        )}
      </div>
      <p
        className="text-xs leading-[1.85] text-[var(--foreground)] sm:text-sm sm:leading-[1.9]"
        aria-label={state.text}
        aria-busy={typing}
      >
        {state.text.slice(0, visibleLength)}
        {typing && (
          <span className="dex-blink ml-px inline-block w-[0.55em] bg-[var(--foreground)] align-[-0.1em]" aria-hidden>
            {"\u00a0"}
          </span>
        )}
      </p>
    </>
  );
}
