import Link from "next/link";

import { DexBall } from "@/components/DexBall";
import UsernameForm from "@/components/UsernameForm";
import { COPY } from "@/lib/copy";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <section className="gba-panel tile-route-faint w-full max-w-lg px-6 py-9 text-center sm:px-8">
        <div className="flex justify-center">
          <DexBall size={44} />
        </div>

        <p className="mt-5 font-display text-[0.5rem] uppercase tracking-wider text-[var(--muted)]">
          {COPY.notFound.kicker}
        </p>
        <h1 className="mt-3 font-display text-[0.95rem] leading-relaxed text-[var(--foreground)]">
          {COPY.notFound.title}
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-xs leading-[1.9] text-[var(--muted)]">
          {COPY.notFound.detail}
        </p>

        <div className="mt-7 flex justify-center">
          <UsernameForm />
        </div>

        <Link
          href="/"
          className="mt-6 inline-block text-[11px] text-[var(--muted)] underline
                     decoration-dotted underline-offset-4 transition hover:text-[var(--accent)]"
        >
          {COPY.notFound.back}
        </Link>
      </section>
    </main>
  );
}
