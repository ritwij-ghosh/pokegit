import Link from "next/link";

import SoundToggle from "@/components/SoundToggle";
import ThemeToggle from "@/components/ThemeToggle";
import Wordmark from "@/components/Wordmark";

/** Title bar. Full dialogue-box treatment: it is chrome, not data. */
export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-[var(--ink)] bg-[var(--surface)]">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="transition-opacity hover:opacity-80"
          aria-label="PokeGit home"
        >
          <Wordmark />
        </Link>

        <div className="flex items-center gap-2">
          <SoundToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
