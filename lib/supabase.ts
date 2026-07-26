/**
 * Server-side Supabase client for the generate-once Pokédex entry cache.
 * Never import this from client components.
 */

import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !key.includes("your_"));
}

export function getSupabase(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || key.includes("your_")) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) in .env.local.",
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
