/**
 * End-to-end smoke test for generate-once Pokédex caching.
 *
 * Usage: npx tsx --conditions=react-server --env-file=.env.local scripts/test-pokedex-cache.ts [username]
 */

import { getPokeGitProfile } from "../lib/profile";
import {
  getPokedexEntry,
  releasePokedexClaim,
  savePokedexEntry,
} from "../lib/pokedex-entries";
import { runPokedexGeneration } from "../lib/pokedex-generation";
import { isSupabaseConfigured } from "../lib/supabase";

async function main() {
  const username = (process.argv[2] || "octocat").toLowerCase();
  console.log(`\n=== Pokédex cache test for @${username} ===\n`);

  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured in .env.local");
  }

  const profile = await getPokeGitProfile(username);
  console.log("Fetched profile:", profile.profile.login, profile.typing.primary);

  const before = await getPokedexEntry(username);
  console.log(
    "Before:",
    before
      ? {
          entryNumber: before.entry_number,
          hasEntry: Boolean(before.pokedex_entry),
          source: before.pokedex_entry_source,
          generatedAt: before.pokedex_entry_generated_at,
        }
      : null,
  );

  // If a prior run left a stuck claim, release it so this test can proceed.
  if (before && !before.pokedex_entry) {
    await releasePokedexClaim(username);
  }

  const preferFallback = !process.env.GROQ_API_KEY?.trim();
  console.log("Mode:", preferFallback ? "fallback (no GROQ_API_KEY)" : "groq");

  const first = before?.pokedex_entry
    ? before
    : await runPokedexGeneration(profile, { preferFallback });

  console.log("After first generation:", {
    entryNumber: first?.entry_number,
    entry: first?.pokedex_entry?.slice(0, 120),
    source: first?.pokedex_entry_source,
    generatedAt: first?.pokedex_entry_generated_at,
  });

  if (!first?.pokedex_entry) {
    throw new Error("Expected entry to be saved after first generation");
  }
  if (typeof first.entry_number !== "number" || first.entry_number < 1) {
    throw new Error("Expected a positive sequential entry_number");
  }
  if (before?.entry_number != null && before.entry_number !== first.entry_number) {
    throw new Error("entry_number changed after generation — should be stable");
  }

  const second = await runPokedexGeneration(profile, { preferFallback });
  if (second?.pokedex_entry !== first.pokedex_entry) {
    throw new Error("Cache forever violated — second run changed the entry");
  }
  if (second?.pokedex_entry_generated_at !== first.pokedex_entry_generated_at) {
    throw new Error("Cache forever violated — generated_at changed on second run");
  }
  if (second?.entry_number !== first.entry_number) {
    throw new Error("entry_number changed on second run");
  }
  console.log("Second run: cache hit confirmed (same text + timestamp + entry_number)");

  // Confirm the fill-once UPDATE path cannot overwrite an existing entry.
  // Uses the app helper (service role bypasses RLS, so a raw UPDATE would succeed).
  const overwrote = await savePokedexEntry(
    username,
    "SHOULD_NOT_PERSIST",
    "fallback",
  );
  if (overwrote) {
    throw new Error("Fill-once guard failed — existing entry was overwritten");
  }
  console.log("Overwrite attempt rejected (fill-once intact)");

  const cached = await getPokedexEntry(username);
  if (cached?.pokedex_entry === "SHOULD_NOT_PERSIST") {
    throw new Error("Entry was overwritten despite fill-once guard");
  }
  if (cached?.entry_number !== first.entry_number) {
    throw new Error("entry_number changed during overwrite attempt");
  }

  console.log(
    "\nOK — entry permanently cached for",
    cached?.username,
    `NO. ${String(cached?.entry_number).padStart(3, "0")}`,
  );
  console.log(cached?.pokedex_entry);
}

main().catch((error) => {
  console.error("\nFAILED:", error);
  process.exit(1);
});
