import Link from "next/link";

import UsernameForm from "@/components/UsernameForm";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-20 text-center">
      <span className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
        no entry found
      </span>
      <h1 className="text-3xl font-semibold">
        There is no GitHub profile by that name.
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-[var(--muted)]">
        Check the spelling, or try a different username. PokeGit only reads
        public profiles.
      </p>
      <div className="mt-2 flex w-full max-w-md justify-center">
        <UsernameForm />
      </div>
      <Link
        href="/"
        className="font-mono text-xs text-[var(--muted)] transition hover:text-[var(--foreground)]"
      >
        ← back to search
      </Link>
    </main>
  );
}
