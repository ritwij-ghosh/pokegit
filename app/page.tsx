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
        className="pointer-events-none absolute left-1/2 top-[42%] h-[42rem] w-[42rem]
                   -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-3xl
                   lg:left-[38%]"
        style={{
          background:
            "radial-gradient(circle, var(--accent-soft) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-10">
        {/* Hero: form and card fan as equal visual partners. */}
        <div
          className="flex flex-col items-center gap-10
                     lg:flex-row lg:items-start lg:justify-between lg:gap-6 xl:gap-8"
        >
          <div className="rise relative w-full max-w-2xl shrink-0 lg:max-w-[32rem] xl:max-w-[34rem]">
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

              <h2 className="mt-6 max-w-lg font-display text-[0.85rem] leading-relaxed text-[var(--foreground)] sm:text-[0.95rem]">
                {COPY.home.hook}
              </h2>

              <p className="mt-4 max-w-lg font-card text-base leading-relaxed tracking-normal text-[var(--muted)] sm:text-[1.0625rem] sm:leading-[1.65]">
                {COPY.brand.tagline}
              </p>

              <div className="mt-8">
                <UsernameForm autoFocus />
              </div>
            </section>
          </div>

          <Suspense fallback={<DemoCardShowcaseFallback />}>
            <DemoCardShowcase />
          </Suspense>
        </div>

        {/* Spec list sits under the hero so it doesn't dwarf the cards. */}
        <dl className="rise mx-auto grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-none lg:grid-cols-4">
          {COPY.home.highlights.map((item) => (
            <div
              key={item.label}
              className="gba-select dex-panel flex gap-3 px-4 py-3 backdrop-blur-[2px]"
            >
              <DexBall size={16} className="mt-0.5 shrink-0" />
              <div className="min-w-0">
                <dt className="font-display text-[0.55rem] leading-relaxed text-[var(--foreground)]">
                  {item.label}
                </dt>
                <dd className="mt-1.5 font-card text-sm leading-relaxed tracking-normal text-[var(--muted)]">
                  {item.detail}
                </dd>
              </div>
            </div>
          ))}
        </dl>

        <p className="text-center">
          <Link
            href="/docs"
            className="font-card text-sm tracking-normal text-[var(--muted)] underline
                       decoration-dotted underline-offset-4 transition-colors
                       hover:text-[var(--foreground)]"
          >
            {COPY.docs.homeLink}
          </Link>
        </p>
      </div>
    </main>
  );
}
