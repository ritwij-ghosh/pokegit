/**
 * Dev-only card harness.
 *
 * Renders the card across a spread of languages so palette derivation can be
 * checked against greys, neons and dark colors at once, rather than one
 * profile at a time. Also renders one card per Pokemon type so art-window
 * backdrops can be eyeballed together. Not linked from anywhere in the app.
 */

import PokeCard from "@/components/PokeCard";
import { ALL_POKEMON_TYPES } from "@/lib/docs-catalog";
import { dexNumber } from "@/lib/dex";
import { languageColor, languageToPokemonType } from "@/lib/language-types";

const SAMPLES = [
  { username: "torvalds", language: "C", hp: 186, ability: "Architect" },
  { username: "gaearon", language: "JavaScript", hp: 118, ability: "Influencer" },
  { username: "kennethreitz", language: "Python", hp: 140, ability: "Prolific" },
  { username: "burntsushi", language: "Rust", hp: 172, ability: "Specialist" },
  { username: "bradfitz", language: "Go", hp: 205, ability: "Streak Master" },
  { username: "dhh", language: "Ruby", hp: 96, ability: "Solo Artist" },
  { username: "shadcn", language: "TypeScript", hp: 233, ability: "Viral Hit" },
  { username: "a-very-long-github-name", language: "Shell", hp: 61, ability: "Community Pillar" },
  { username: "jakewharton", language: "Kotlin", hp: 149, ability: "Weekend Warrior" },
  { username: "steipete", language: "Swift", hp: 128, ability: "Night Owl" },
  { username: "taylorotwell", language: "PHP", hp: 111, ability: "Mentor" },
  { username: "solidity-dev", language: "Solidity", hp: 88, ability: "Newcomer" },
];

/** Fixed language tint so type scenes are the only variable. */
const TYPE_HARNESS_LANGUAGE = "TypeScript";
const TYPE_HARNESS_COLOR = languageColor(TYPE_HARNESS_LANGUAGE);

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
                abilityName={sample.ability}
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

      <h2 className="mb-8 mt-16 font-display text-[0.7rem] uppercase text-[var(--foreground)]">
        type art backdrops
      </h2>
      <p className="mb-8 max-w-xl text-[12px] text-[var(--muted)]">
        Same language tint ({TYPE_HARNESS_LANGUAGE}) on every card — only the
        Pokemon type changes, so art-window scenes can be compared side by side.
      </p>
      <div className="flex flex-wrap gap-10">
        {ALL_POKEMON_TYPES.map((type) => (
          <div key={type} className="flex flex-col items-center gap-2">
            <PokeCard
              username="pokegit"
              type={type}
              hp={120}
              languageColor={TYPE_HARNESS_COLOR}
              languageName={TYPE_HARNESS_LANGUAGE}
              avatarUrl="https://github.com/vercel.png?size=460"
              dexNumber={dexNumber(`type-${type}`)}
              width="280px"
              allowImageUpload={false}
            />
            <span className="text-[11px] text-[var(--muted)]">{type}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
