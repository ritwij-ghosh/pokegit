/**
 * Lightweight poll endpoint for pending Pokédex entries.
 * Read-only — never triggers generation (that only happens on the profile page).
 */

import { NextResponse } from "next/server";

import { getPokedexEntry } from "@/lib/pokedex-entries";
import { allowRequest } from "@/lib/rate-limit";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ username: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { username } = await context.params;
  const login = decodeURIComponent(username).trim().replace(/^@/, "");

  if (!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(login)) {
    return NextResponse.json({ error: "invalid username" }, { status: 400 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anon";

  // Generous enough for the pending-entry poller (~1 req/s for ~20s) plus
  // normal page usage; still blocks abusive scraping.
  if (!allowRequest(`poll:${ip}`, 120, 60_000)) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }

  const row = await getPokedexEntry(login);
  if (!row) {
    return NextResponse.json({ status: "missing" });
  }

  if (row.pokedex_entry) {
    return NextResponse.json({
      status: "ready",
      text: row.pokedex_entry,
      source: row.pokedex_entry_source ?? "cache",
      generatedAt: row.pokedex_entry_generated_at,
    });
  }

  return NextResponse.json({
    status: "pending",
    generating: Boolean(row.generation_started_at),
  });
}
