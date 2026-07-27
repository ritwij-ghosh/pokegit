/**
 * Generate-once orchestration for Pokédex entries.
 *
 * First visit awaits generation and returns the produced text directly (does
 * not depend on a Supabase re-read), so Next fetch-cache quirks cannot leave
 * the page stuck on "pending".
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
  entryNumber: number | null;
};

const GEN_RATE_LIMIT = 12;
const GEN_RATE_WINDOW_MS = 60_000;

const inFlight = new Map<string, Promise<PokedexEntryRow | null>>();

function normalizeLogin(login: string): string {
  return login.trim().replace(/^@/, "").toLowerCase();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function flavorFromRow(row: PokedexEntryRow): FlavorView {
  const text = row.pokedex_entry;
  if (!text) return { status: "pending" };
  return {
    status: "ready",
    text,
    source:
      row.pokedex_entry_source === "fallback"
        ? "fallback"
        : row.pokedex_entry_source === "llm"
          ? "llm"
          : "cache",
  };
}

function rowWithEntry(
  base: PokedexEntryRow,
  text: string,
  source: "llm" | "fallback",
): PokedexEntryRow {
  return {
    ...base,
    pokedex_entry: text,
    pokedex_entry_source: source,
    pokedex_entry_generated_at: new Date().toISOString(),
    generation_started_at: null,
  };
}

export async function resolveFlavorForProfile(
  profile: PokeGitProfile,
  opts?: { clientKey?: string },
): Promise<FlavorResolution> {
  if (!isSupabaseConfigured()) {
    return {
      flavor: { status: "offline", text: fallbackFlavorText(profile) },
      entryNumber: null,
    };
  }

  const row = await ensurePokedexRow(profile.profile.login);
  const entryNumber = row?.entry_number ?? null;

  if (row?.pokedex_entry) {
    return { flavor: flavorFromRow(row), entryNumber };
  }

  const preferFallback = !isGroqConfigured();
  const login = normalizeLogin(profile.profile.login);
  const key = opts?.clientKey ?? "anon";

  if (!allowRequest(`gen:${key}`, GEN_RATE_LIMIT, GEN_RATE_WINDOW_MS)) {
    console.warn(
      `[pokedex-generation] rate limited for ${key}; returning pending.`,
    );
    return { flavor: { status: "pending" }, entryNumber };
  }

  const genPromise = getOrStartGeneration(profile, { preferFallback });

  after(async () => {
    try {
      const result = await genPromise;
      if (result?.pokedex_entry) {
        console.info(
          `[pokedex-generation] cached entry for ${login} (${result.pokedex_entry_source})`,
        );
      } else {
        console.warn(
          `[pokedex-generation] finished without entry for ${login}`,
        );
      }
    } catch (error) {
      console.error(`[pokedex-generation] after() failed for ${login}`, error);
    }
  });

  const result = await genPromise;

  if (result?.pokedex_entry) {
    return {
      flavor: flavorFromRow(result),
      entryNumber: result.entry_number ?? entryNumber,
    };
  }

  return { flavor: { status: "pending" }, entryNumber };
}

function getOrStartGeneration(
  profile: PokeGitProfile,
  options?: { preferFallback?: boolean },
): Promise<PokedexEntryRow | null> {
  const login = normalizeLogin(profile.profile.login);
  const existing = inFlight.get(login);
  if (existing) return existing;

  const promise = runPokedexGeneration(profile, options).finally(() => {
    inFlight.delete(login);
  });
  inFlight.set(login, promise);
  return promise;
}

async function buildEntryText(
  profile: PokeGitProfile,
  options?: { preferFallback?: boolean },
): Promise<{ text: string; source: "llm" | "fallback" }> {
  if (options?.preferFallback || !isGroqConfigured()) {
    return { text: fallbackFlavorText(profile), source: "fallback" };
  }

  const llm = await generateFlavorTextWithGroq(profile);
  if (llm) return { text: llm, source: "llm" };

  console.warn(
    `[pokedex-generation] Groq empty/failed for ${normalizeLogin(profile.profile.login)}; saving fallback`,
  );
  return { text: fallbackFlavorText(profile), source: "fallback" };
}

export async function runPokedexGeneration(
  profile: PokeGitProfile,
  options?: { preferFallback?: boolean },
): Promise<PokedexEntryRow | null> {
  const login = normalizeLogin(profile.profile.login);
  const base = await ensurePokedexRow(login);
  if (!base) return null;
  if (base.pokedex_entry) return base;

  // Best-effort claim only — never abort generation because of a busy claim.
  let claimed = await claimPokedexGeneration(login);
  if (!claimed) {
    await sleep(800);
    const afterWait = await getPokedexEntry(login);
    if (afterWait?.pokedex_entry) return afterWait;
    console.warn(
      `[pokedex-generation] claim busy for ${login}; generating without exclusive claim`,
    );
    await releasePokedexClaim(login);
    claimed = await claimPokedexGeneration(login);
  }

  try {
    const { text, source } = await buildEntryText(profile, options);
    const saved = await savePokedexEntry(login, text, source);
    if (!saved) {
      // Race loser: prefer the winner's persisted text when readable.
      const winner = await getPokedexEntry(login);
      if (winner?.pokedex_entry) return winner;
      console.warn(
        `[pokedex-generation] save missed for ${login}; returning in-memory entry`,
      );
    }
    // Always return the text we produced so the first response is never pending
    // due to a stale Supabase re-read.
    return rowWithEntry(base, text, source);
  } catch (error) {
    console.error("[pokedex-generation] failed", error);
    const fallback = fallbackFlavorText(profile);
    try {
      await savePokedexEntry(login, fallback, "fallback");
    } catch (saveError) {
      console.error("[pokedex-generation] fallback save failed", saveError);
    } finally {
      if (claimed) await releasePokedexClaim(login);
    }
    return rowWithEntry(base, fallback, "fallback");
  }
}
