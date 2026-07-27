/**
 * Permanent Pokédex-entry cache. Generate once per username, never regenerate.
 */

import "server-only";

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export type PokedexEntrySource = "llm" | "fallback";

export interface PokedexEntryRow {
  username: string;
  /** Stable sequential Pokédex number, assigned on first-visit insert. */
  entry_number: number;
  pokedex_entry: string | null;
  pokedex_entry_generated_at: string | null;
  pokedex_entry_source: PokedexEntrySource | null;
  generation_started_at: string | null;
  created_at: string;
  updated_at: string;
}

function normalizeUsername(username: string): string {
  return username.trim().replace(/^@/, "").toLowerCase();
}

/** How long a "generating" claim is considered in-flight before we allow reclaim. */
const CLAIM_STALE_MS = 15_000;

export async function getPokedexEntry(
  username: string,
): Promise<PokedexEntryRow | null> {
  if (!isSupabaseConfigured()) return null;
  const login = normalizeUsername(username);
  const { data, error } = await getSupabase()
    .from("pokegit_entries")
    .select("*")
    .eq("username", login)
    .maybeSingle();

  if (error) {
    console.error("[pokedex-entries] read failed", error.message);
    return null;
  }
  return data as PokedexEntryRow | null;
}

/**
 * Ensure a row exists for this username. Does not generate text.
 * Returns the row (existing or freshly inserted).
 */
export async function ensurePokedexRow(
  username: string,
): Promise<PokedexEntryRow | null> {
  if (!isSupabaseConfigured()) return null;
  const login = normalizeUsername(username);

  const existing = await getPokedexEntry(login);
  if (existing) return existing;

  const { data, error } = await getSupabase()
    .from("pokegit_entries")
    .insert({ username: login })
    .select("*")
    .maybeSingle();

  if (error) {
    // Race: another request inserted first — re-read.
    if (error.code === "23505") return getPokedexEntry(login);
    console.error("[pokedex-entries] insert failed", error.message);
    return getPokedexEntry(login);
  }

  return data as PokedexEntryRow | null;
}

/**
 * Atomically claim the right to generate for this username.
 * Returns true only for the winner. Stale claims can be reclaimed.
 */
export async function claimPokedexGeneration(
  username: string,
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const login = normalizeUsername(username);

  const row = await ensurePokedexRow(login);
  if (!row) return false;
  if (row.pokedex_entry) return false;

  const staleSeconds = Math.floor(CLAIM_STALE_MS / 1000);
  const { data, error } = await getSupabase().rpc("claim_pokegit_entry", {
    p_username: login,
    p_stale_seconds: staleSeconds,
  });

  if (error) {
    console.error("[pokedex-entries] claim failed", error.message);
    return false;
  }
  // PostgREST normally returns a boolean; be tolerant of truthy edge cases.
  return data === true || data === "t" || data === 1;
}

export async function savePokedexEntry(
  username: string,
  entry: string,
  source: PokedexEntrySource,
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const login = normalizeUsername(username);
  const now = new Date().toISOString();

  const { data, error, count } = await getSupabase()
    .from("pokegit_entries")
    .update(
      {
        pokedex_entry: entry,
        pokedex_entry_generated_at: now,
        pokedex_entry_source: source,
        generation_started_at: null,
        updated_at: now,
      },
      { count: "exact" },
    )
    .eq("username", login)
    .is("pokedex_entry", null)
    .select("username");

  if (error) {
    console.error("[pokedex-entries] save failed", error.message);
    return false;
  }
  const rows = Array.isArray(data) ? data.length : data ? 1 : 0;
  return rows > 0 || (count ?? 0) > 0;
}

/** Clear a failed claim so a later visit can try again (no busy-loop retries). */
export async function releasePokedexClaim(username: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const login = normalizeUsername(username);
  const { error } = await getSupabase()
    .from("pokegit_entries")
    .update({
      generation_started_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("username", login)
    .is("pokedex_entry", null);

  if (error) {
    console.error("[pokedex-entries] release failed", error.message);
  }
}
