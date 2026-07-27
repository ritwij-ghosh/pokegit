import Link from "next/link";

import GitHubStarLink from "@/components/GitHubStarLink";
import SoundToggle from "@/components/SoundToggle";
import ThemeToggle from "@/components/ThemeToggle";
import Wordmark from "@/components/Wordmark";
import { COPY } from "@/lib/copy";

/** Title bar. Full dialogue-box treatment: it is chrome, not data. */
export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-[var(--ink)] bg-[var(--surface)]">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="min-w-0 transition-opacity hover:opacity-80"
          aria-label="PokeGit home"
        >
          <Wordmark />
        </Link>

        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <Link
            href="/docs"
            className="font-display text-[0.5rem] uppercase tracking-wider text-[var(--muted)]
                       transition-colors hover:text-[var(--foreground)]"
          >
            {COPY.docs.navLabel}
          </Link>
          <Link
            href="/contact"
            className="font-display text-[0.5rem] uppercase tracking-wider text-[var(--muted)]
                       transition-colors hover:text-[var(--foreground)]"
          >
            {COPY.nav.contactLabel}
          </Link>
          <SoundToggle />
          <ThemeToggle />
          <GitHubStarLink />
        </div>
      </div>
    </header>
  );
}
