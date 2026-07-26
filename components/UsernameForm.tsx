"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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
      <form onSubmit={submit} className="flex gap-2">
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
          placeholder="github username"
          aria-label="GitHub username"
          className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)]
                     px-4 py-3 font-mono text-sm text-[var(--foreground)]
                     placeholder:text-[var(--muted)]
                     outline-none transition focus:border-[var(--accent)]
                     focus:ring-2 focus:ring-[var(--accent)]/20"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold
                     tracking-wide text-black transition hover:brightness-110
                     disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "SCANNING…" : "SCAN →"}
        </button>
      </form>

      <div className="mt-3 flex min-h-5 items-center gap-2 text-xs">
        {error ? (
          <span className="text-red-400">{error}</span>
        ) : (
          <span className="text-[var(--muted)]">
            try{" "}
            {["torvalds", "sindresorhus", "rich-harris"].map((name, index) => (
              <span key={name}>
                {index > 0 && " · "}
                <button
                  type="button"
                  onClick={() => startTransition(() => router.push(`/${name}`))}
                  className="font-mono underline decoration-dotted underline-offset-4
                             transition hover:text-[var(--foreground)]"
                >
                  {name}
                </button>
              </span>
            ))}{" "}
            · or your own
          </span>
        )}
      </div>
    </div>
  );
}
