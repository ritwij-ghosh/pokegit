"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { COPY } from "@/lib/copy";
import { DEMO_USERNAMES } from "@/lib/site";

const GITHUB_USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export default function UsernameForm({
  autoFocus = false,
}: {
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const login = value.trim().replace(/^@/, "");
    if (!login) {
      setError("Enter a GitHub username.");
      return;
    }
    if (!GITHUB_USERNAME.test(login)) {
      setError("That is not a valid GitHub username.");
      return;
    }
    setError(null);
    startTransition(() => router.push(`/${login}`));
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
        <input
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (error) setError(null);
          }}
          autoFocus={autoFocus}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={COPY.home.inputPlaceholder}
          aria-label="GitHub username"
          className="gba-field min-w-0 flex-1 px-3 py-3 font-card text-base tracking-normal
                     text-[var(--foreground)] placeholder:text-[var(--muted)]"
        />
        <button
          type="submit"
          disabled={pending}
          className="gba-btn gba-btn-primary shrink-0 px-4 py-3 font-display text-[0.6rem]
                     uppercase"
        >
          {pending ? (
            <span className="dex-blink">{COPY.home.submitPending}</span>
          ) : (
            <span className="inline-flex items-center gap-2">
              {COPY.home.submitIdle}
              <Caret />
            </span>
          )}
        </button>
      </form>

      <div className="mt-3 flex min-h-5 items-start gap-2 font-card text-sm leading-relaxed tracking-normal">
        {error ? (
          <span className="text-[var(--pokedex-red)]">{error}</span>
        ) : (
          <span className="text-[var(--muted)]">
            {COPY.home.tryPrompt}{" "}
            {DEMO_USERNAMES.map((name, index) => (
              <span key={name}>
                {index > 0 && " / "}
                <button
                  type="button"
                  onClick={() => startTransition(() => router.push(`/${name}`))}
                  className="underline decoration-dotted underline-offset-4
                             transition hover:text-[var(--accent)]"
                >
                  {name}
                </button>
              </span>
            ))}{" "}
            / {COPY.home.tryTail}
          </span>
        )}
      </div>
    </div>
  );
}

/** Pixel caret, standing in for an arrow glyph the display font lacks. */
function Caret() {
  return (
    <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor" aria-hidden>
      <rect x="0" y="0" width="2" height="2" />
      <rect x="2" y="2" width="2" height="2" />
      <rect x="4" y="4" width="2" height="2" />
      <rect x="2" y="6" width="2" height="2" />
      <rect x="0" y="8" width="2" height="2" />
    </svg>
  );
}
