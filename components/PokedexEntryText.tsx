"use client";

import { useEffect, useState } from "react";

import { COPY } from "@/lib/copy";

const CHAR_MS = 22;
const MAX_POLL_MS = 90_000;

type FlavorState =
  | { status: "ready"; text: string; source: string }
  | { status: "pending" }
  | { status: "offline"; text: string };

type Props = {
  username: string;
  initial: FlavorState;
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function delayForAttempt(attempt: number) {
  if (attempt < 8) return 500;
  if (attempt < 20) return 1000;
  return 2000;
}

/**
 * Shows a cached entry with a Pokédex-style typewriter, or in-theme pending
 * copy that polls until the write lands. If the page rendered pending (RSC
 * work aborted), kicks the generate route once — claim/fill-once still guard
 * double-generation.
 */
export default function PokedexEntryText({ username, initial }: Props) {
  const [state, setState] = useState<FlavorState>(initial);
  const fullText =
    state.status === "ready" || state.status === "offline" ? state.text : null;
  const [visibleLength, setVisibleLength] = useState(0);

  useEffect(() => {
    if (state.status !== "pending") return;

    let cancelled = false;
    let attempts = 0;
    let timer: number | null = null;
    const startedAt = Date.now();

    const clearTimer = () => {
      if (timer != null) {
        window.clearTimeout(timer);
        timer = null;
      }
    };

    const schedule = (ms: number) => {
      clearTimer();
      timer = window.setTimeout(() => {
        void poll();
      }, ms);
    };

    async function poll() {
      if (cancelled) return;
      attempts += 1;

      try {
        const res = await fetch(
          `/api/pokedex/${encodeURIComponent(username)}`,
          { cache: "no-store" },
        );
        if (cancelled) return;

        if (res.ok) {
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
        }
      } catch {
        // ignore transient poll errors
      }

      if (cancelled) return;
      if (Date.now() - startedAt >= MAX_POLL_MS) return;
      schedule(delayForAttempt(attempts));
    }

    // Recover from aborted server-side after()/HMR: one guarded generate kick.
    void fetch(`/api/pokedex/${encodeURIComponent(username)}/generate`, {
      method: "POST",
      cache: "no-store",
    }).catch(() => {
      // poller will still observe any later write
    });

    schedule(300);
    return () => {
      cancelled = true;
      clearTimer();
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
        <div className="mb-2">
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
      {showOffline && (
        <div className="mb-2">
          <span
            className="border border-[var(--border)] px-1.5 py-px text-[10px] text-[var(--muted)]"
            title={COPY.profile.offlineHint}
          >
            {COPY.profile.offlineBadge}
          </span>
        </div>
      )}
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
