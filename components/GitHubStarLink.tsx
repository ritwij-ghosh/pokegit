"use client";

import { useEffect, useState } from "react";

import { COPY } from "@/lib/copy";
import { SITE_REPO } from "@/lib/site";

function formatStars(count: number): string {
  if (count < 1000) return String(count);
  if (count < 10_000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return `${Math.round(count / 1000)}k`;
}

async function loadStars(): Promise<number | null> {
  try {
    const response = await fetch("/api/repo-stars", { cache: "no-store" });
    if (!response.ok) return null;
    const data = (await response.json()) as { stars?: number | null };
    return typeof data.stars === "number" ? data.stars : null;
  } catch {
    return null;
  }
}

/** Compact CTA: opens the public repo so visitors can star it. */
export default function GitHubStarLink() {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const refresh = () => {
      void loadStars().then((count) => {
        if (!cancelled) setStars(count);
      });
    };

    refresh();

    // After starring on GitHub and returning, pick up the new count.
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    const interval = window.setInterval(refresh, 60_000);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(interval);
    };
  }, []);

  return <GitHubStarButton stars={stars} />;
}

/** Suspense placeholder — same chrome while the client hydrates. */
export function GitHubStarFallback() {
  return <GitHubStarButton stars={null} />;
}

function GitHubStarButton({ stars }: { stars: number | null }) {
  return (
    <a
      href={SITE_REPO.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={
        stars === null
          ? COPY.nav.starAria
          : `${COPY.nav.starAria} (${formatStars(stars)})`
      }
      title={COPY.nav.starLabel}
      className="gba-btn inline-flex h-9 shrink-0 items-center gap-1.5 px-2.5
                 text-[var(--foreground)] sm:gap-2 sm:px-3"
    >
      <StarIcon />
      <span className="font-display text-[0.45rem] uppercase tracking-wider">
        <span className="sm:hidden">{COPY.nav.starLabelShort}</span>
        <span className="hidden sm:inline">{COPY.nav.starLabel}</span>
      </span>
      {stars !== null ? (
        <span className="font-display text-[0.45rem] tabular-nums text-[var(--muted)]">
          {formatStars(stars)}
        </span>
      ) : null}
    </a>
  );
}

/** Classic five-point star — smooth vectors, no pixel stepping. */
function StarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className="text-[var(--accent)]"
      shapeRendering="geometricPrecision"
    >
      <path d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.27l-5.8 3.1 1.11-6.47-4.7-4.58 6.49-.94L12 2.5z" />
    </svg>
  );
}
