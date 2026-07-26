export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-4 px-6 py-20">
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 animate-ping rounded-full bg-[var(--accent)]" />
        <span className="font-mono text-sm text-[var(--muted)]">
          scanning profile…
        </span>
      </div>
      <p className="max-w-sm text-center text-xs leading-relaxed text-[var(--muted)]">
        Reading the contribution calendar, walking the repository list and
        sampling commit timestamps. This takes a few seconds.
      </p>
    </main>
  );
}
