/**
 * Dedicated generation endpoint. Invoked from the profile page (via after()
 * keepalive fallback) so work is not tied to a cancellable RSC render.
 * Claim + fill-once guards still prevent double-generation.
 */

import { NextResponse } from "next/server";

import { isGroqConfigured } from "@/lib/flavor-text";
import { GitHubError, UserNotFoundError } from "@/lib/github";
import { runPokedexGeneration } from "@/lib/pokedex-generation";
import { getPokeGitProfile } from "@/lib/profile";
import { allowRequest } from "@/lib/rate-limit";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type RouteContext = { params: Promise<{ username: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { username } = await context.params;
  const login = decodeURIComponent(username).trim().replace(/^@/, "");

  if (!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(login)) {
    return NextResponse.json({ error: "invalid username" }, { status: 400 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anon";

  if (!allowRequest(`gen-api:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }

  try {
    const profile = await getPokeGitProfile(login);
    const result = await runPokedexGeneration(profile, {
      preferFallback: !isGroqConfigured(),
    });

    if (result?.pokedex_entry) {
      return NextResponse.json({
        status: "ready",
        text: result.pokedex_entry,
        source: result.pokedex_entry_source ?? "cache",
        generatedAt: result.pokedex_entry_generated_at,
      });
    }

    return NextResponse.json({ status: "pending" });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    if (error instanceof GitHubError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    console.error("[pokedex-generate] failed", error);
    return NextResponse.json({ error: "generation failed" }, { status: 500 });
  }
}
