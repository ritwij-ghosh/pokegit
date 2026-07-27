import { DexBallSpinner } from "@/components/DexBall";
import { COPY } from "@/lib/copy";

export default function Loading() {
  return (
    <main className="tile-route flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <section className="gba-panel tile-route-faint w-full max-w-md px-6 py-10 text-center">
        <div className="flex justify-center">
          <DexBallSpinner size={44} />
        </div>
        <p className="mt-6 font-display text-[0.6rem] leading-relaxed text-[var(--foreground)]">
          {COPY.loading.title}
        </p>
        <p className="mx-auto mt-4 max-w-xs font-card text-sm leading-relaxed tracking-normal text-[var(--muted)]">
          {COPY.loading.detail}
        </p>
      </section>
    </main>
  );
}
