import { Suspense } from "react";
import Link from "next/link";

import {
  DemoCardShowcase,
  DemoCardShowcaseFallback,
} from "@/components/DemoCardShowcase";
import { DexBall } from "@/components/DexBall";
import UsernameForm from "@/components/UsernameForm";
import Wordmark from "@/components/Wordmark";
import { COPY } from "@/lib/copy";

export default function Home() {
  return (
    <main className="tile-route relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-14 sm:px-6">
      {/* Soft radial glow behind the hero panel. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[42rem] w-[42rem]
                   -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-3xl
                   lg:left-[36%]"
        style={{
          background:
            "radial-gradient(circle, var(--accent-soft) 0%, transparent 70%)",
        }}
      />

      <div
        className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-12
                   lg:flex-row lg:items-center lg:justify-between lg:gap-8 xl:gap-10"
      >
        <div className="rise relative w-full max-w-2xl shrink-0 lg:max-w-[34rem]">
          <section className="gba-panel px-5 py-7 sm:px-9 sm:py-10">
            <span
              className="inline-flex items-center gap-2 border-2 border-[var(--border)]
                         bg-[var(--surface-raised)] px-2.5 py-1 font-display text-[0.5rem]
                         uppercase tracking-wider text-[var(--muted)]"
            >
              <span className="h-2 w-2 bg-[var(--accent)]" />
              {COPY.brand.kicker}
            </span>

            <h1 className="mt-6">
              <span className="sr-only">{COPY.brand.wordmark}</span>
              <span aria-hidden>
                <Wordmark size="hero" />
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-sm leading-[1.9] text-[var(--muted)]">
              {COPY.brand.tagline}
            </p>

            <div className="mt-8">
              <UsernameForm autoFocus />
            </div>
          </section>

          {/* Lighter treatment than the hero panel: this is a spec list, not chrome. */}
          <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {COPY.home.highlights.map((item) => (
              <div
                key={item.label}
                className="dex-panel flex gap-3 px-4 py-3 backdrop-blur-[2px]"
              >
                <DexBall size={16} className="mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <dt className="font-display text-[0.55rem] leading-relaxed text-[var(--foreground)]">
                    {item.label}
                  </dt>
                  <dd className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">
                    {item.detail}
                  </dd>
                </div>
              </div>
            ))}
          </dl>

          <p className="mt-5 text-center lg:text-left">
            <Link
              href="/docs"
              className="text-[11px] tracking-wide text-[var(--muted)] underline
                         decoration-dotted underline-offset-4 transition-colors
                         hover:text-[var(--foreground)]"
            >
              {COPY.docs.homeLink}
            </Link>
          </p>
        </div>

        <Suspense fallback={<DemoCardShowcaseFallback />}>
          <DemoCardShowcase />
        </Suspense>
      </div>
    </main>
  );
}
