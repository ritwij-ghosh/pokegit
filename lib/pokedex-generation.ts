/**
 * Generate-once orchestration for Pokédex entries.
 *
 * On first sight of a username: insert a NULL row, claim generation, and kick
 * off a fire-and-forget Groq call via next/server `after()`. Page render never
 * waits on the LLM.
 */

import "server-only";

import { after } from "next/server";

import {
  fallbackFlavorText,
  generateFlavorTextWithGroq,
  isGroqConfigured,
} from "@/lib/flavor-text";
import {
  claimPokedexGeneration,
  ensurePokedexRow,
  getPokedexEntry,
  releasePokedexClaim,
  savePokedexEntry,
  type PokedexEntryRow,
} from "@/lib/pokedex-entries";
import { allowRequest } from "@/lib/rate-limit";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { PokeGitProfile } from "@/lib/types";

export type FlavorView =
  | { status: "ready"; text: string; source: "llm" | "fallback" | "cache" }
  | { status: "pending" }
  | { status: "offline"; text: string };

export type FlavorResolution = {
  flavor: FlavorView;
  /** Sequential entry number from pokegit_entries; null when offline. */
  entryNumber: number | null;
};

/** Max new generations started per IP (or "anon") per minute. */
const GEN_RATE_LIMIT = 8;
const GEN_RATE_WINDOW_MS = 60_000;

export async function resolveFlavorForProfile(
  profile: PokeGitProfile,
  opts?: { clientKey?: string },
): Promise<FlavorResolution> {
  if (!isSupabaseConfigured()) {
    // No permanent cache available — fall back to local text, never call Groq
    // on every page view (that would burn the free tier).
    return {
      flavor: { status: "offline", text: fallbackFlavorText(profile) },
      entryNumber: null,
    };
  }

  const row = await ensurePokedexRow(profile.profile.login);
  const entryNumber = row?.entry_number ?? null;

  if (row?.pokedex_entry) {
    return {
      flavor: {
        status: "ready",
        text: row.pokedex_entry,
        source: row.pokedex_entry_source === "fallback" ? "fallback" : "cache",
      },
      entryNumber,
    };
  }

  // Re-schedule when there is no in-flight claim (or the claim went stale).
  // This recovers from after() interruptions without busy-looping retries —
  // claimPokedexGeneration is a no-op while a fresh claim is held.
  const preferFallback = !isGroqConfigured();
  scheduleGeneration(profile, opts?.clientKey, { preferFallback });
  return { flavor: { status: "pending" }, entryNumber };
}

function scheduleGeneration(
  profile: PokeGitProfile,
  clientKey?: string,
  options?: { preferFallback?: boolean },
): void {
  const key = clientKey ?? "anon";
  if (!allowRequest(`gen:${key}`, GEN_RATE_LIMIT, GEN_RATE_WINDOW_MS)) {
    console.warn(
      `[pokedex-generation] rate limited for ${key}; skipping schedule.`,
    );
    return;
  }

  after(async () => {
    try {
      const before = await getPokedexEntry(profile.profile.login);
      if (before?.pokedex_entry) return;

      const result = await runPokedexGeneration(profile, options);
      if (result?.pokedex_entry) {
        console.info(
          `[pokedex-generation] cached entry for ${profile.profile.login} (${result.pokedex_entry_source})`,
        );
      } else {
        console.warn(
          `[pokedex-generation] left pending for ${profile.profile.login} (claim busy or API failure)`,
        );
      }
    } catch (error) {
      console.error(
        `[pokedex-generation] after() failed for ${profile.profile.login}`,
        error,
      );
    }
  });
}

export async function runPokedexGeneration(
  profile: PokeGitProfile,
  options?: { preferFallback?: boolean },
): Promise<PokedexEntryRow | null> {
  const login = profile.profile.login;
  const claimed = await claimPokedexGeneration(login);
  if (!claimed) return getPokedexEntry(login);

  try {
    let text: string | null = null;
    let source: "llm" | "fallback" = "llm";

    if (options?.preferFallback || !isGroqConfigured()) {
      text = fallbackFlavorText(profile);
      source = "fallback";
    } else {
      text = await generateFlavorTextWithGroq(profile);
      if (!text) {
        // Per spec: on API failure leave NULL — no retry cascade.
        await releasePokedexClaim(login);
        return getPokedexEntry(login);
      }
      source = "llm";
    }

    await savePokedexEntry(login, text, source);
    return getPokedexEntry(login);
  } catch (error) {
    console.error("[pokedex-generation] failed", error);
    await releasePokedexClaim(login);
    return getPokedexEntry(login);
  }
}
