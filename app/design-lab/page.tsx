/**
 * Dev-only card harness.
 *
 * Renders the card across a spread of languages so palette derivation can be
 * checked against greys, neons and dark colors at once, rather than one
 * profile at a time. Not linked from anywhere in the app.
 */

import PokeCard from "@/components/PokeCard";
import { dexNumber } from "@/lib/dex";
import { languageColor, languageToPokemonType } from "@/lib/language-types";

const SAMPLES = [
  { username: "torvalds", language: "C", hp: 186 },
  { username: "gaearon", language: "JavaScript", hp: 118 },
  { username: "kennethreitz", language: "Python", hp: 140 },
  { username: "burntsushi", language: "Rust", hp: 172 },
  { username: "bradfitz", language: "Go", hp: 205 },
  { username: "dhh", language: "Ruby", hp: 96 },
  { username: "shadcn", language: "TypeScript", hp: 233 },
  { username: "a-very-long-github-name", language: "Shell", hp: 61 },
  { username: "jakewharton", language: "Kotlin", hp: 149 },
  { username: "steipete", language: "Swift", hp: 128 },
  { username: "taylorotwell", language: "PHP", hp: 111 },
  { username: "solidity-dev", language: "Solidity", hp: 88 },
];

export default function DesignLab() {
  return (
    <main className="mx-auto w-full max-w-[1600px] px-8 py-10">
      <h1 className="mb-8 font-display text-[0.7rem] uppercase text-[var(--foreground)]">
        card palette harness
      </h1>
      <div className="flex flex-wrap gap-10">
        {SAMPLES.map((sample) => {
          const type = languageToPokemonType(sample.language);
          return (
            <div key={sample.username} className="flex flex-col items-center gap-2">
              <PokeCard
                username={sample.username}
                type={type}
                hp={sample.hp}
                languageColor={languageColor(sample.language)}
                languageName={sample.language}
                avatarUrl={`https://github.com/${sample.username}.png?size=460`}
                dexNumber={dexNumber(sample.username)}
                width="330px"
                allowImageUpload={false}
              />
              <span className="text-[11px] text-[var(--muted)]">
                {sample.language} / {type} / {languageColor(sample.language)}
              </span>
            </div>
          );
        })}
      </div>
    </main>
  );
}
