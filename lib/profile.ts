/**
 * Assembles a complete PokeGit profile: fetch -> derive -> normalize ->
 * classify -> select moves. Server-side only.
 *
 * The card identity (stats, typing, ability, move ids) is computed together
 * and cached for an hour. Move *ids* are what get persisted — name, power,
 * and description are always hydrated from MOVE_BANK on read so copy edits
 * apply without waiting for the TTL.
 */

import "server-only";

import { unstable_cache } from "next/cache";

import { resolveAbility } from "@/lib/abilities";
import { fetchGitHubData } from "@/lib/github";
import { resolveMoves, selectMovesForProfile } from "@/lib/moves";
import { computeBaseStats, computeTyping, deriveSignals } from "@/lib/stats";
import type { PokeGitProfile } from "@/lib/types";

/** Shape stored in unstable_cache — moves are ids only. */
type CachedPokeGitProfile = Omit<PokeGitProfile, "moves">;

function buildCaveats(
  data: Awaited<ReturnType<typeof fetchGitHubData>>,
  sampleSize: number,
): string[] {
  const caveats: string[] = [];

  if (sampleSize === 0) {
    caveats.push(
      "No commit timestamps could be sampled, so time-of-day patterns were not evaluated.",
    );
  } else {
    caveats.push(
      `Time-of-day pattern is a best-effort approximation from a ${sampleSize}-commit sample across recently pushed repositories, not full commit history.`,
    );
  }

  if (data.contributions.restrictedContributionsCount > 0) {
    caveats.push(
      `${data.contributions.restrictedContributionsCount.toLocaleString()} contributions are in private repositories and are not counted.`,
    );
  }

  if (data.repoListTruncated) {
    caveats.push(
      `This account owns more than ${data.repos.length} repositories; star and repo counts cover only the ${data.repos.length} most recently pushed.`,
    );
  }

  if (data.reposSampled === 0) {
    caveats.push("No public non-fork repositories were found to read languages from.");
  } else if (data.repos.filter((r) => !r.isFork).length > data.reposSampled) {
    caveats.push(
      `Language bytes were aggregated from the ${data.reposSampled} most-starred repositories.`,
    );
  }

  return caveats;
}

async function buildCachedProfile(username: string): Promise<CachedPokeGitProfile> {
  const raw = await fetchGitHubData(username);
  const signals = deriveSignals(raw);
  const stats = computeBaseStats(raw, signals);
  const typing = computeTyping(signals);
  const ability = resolveAbility({ signals, raw });
  const selected = selectMovesForProfile(raw, signals);
  const moveIds: [string, string] = [selected[0].id, selected[1].id];

  return {
    profile: raw.profile,
    stats,
    typing,
    ability,
    moveIds,
    signals,
    raw: {
      totalContributions: raw.contributions.totalContributions,
      commits: raw.contributions.totalCommitContributions,
      reviews: raw.contributions.totalPullRequestReviewContributions,
      issuesOpened: raw.totalIssuesOpened,
      issuesClosed: raw.totalIssuesClosed,
      pullRequestsOpened: raw.pullRequestsOpened,
      pullRequestsMerged: raw.pullRequestsMerged,
      totalStars: signals.totalStars,
      topRepoStars: signals.topRepoStars,
      followers: raw.profile.followers,
      publicRepos: raw.profile.publicRepoCount,
    },
    caveats: buildCaveats(raw, signals.timeOfDay.sampleSize),
  };
}

function hydrateProfile(cached: CachedPokeGitProfile): PokeGitProfile {
  return {
    ...cached,
    moves: resolveMoves(cached.moveIds),
  };
}

export async function getPokeGitProfile(
  username: string,
): Promise<PokeGitProfile> {
  const login = username.trim().replace(/^@/, "").toLowerCase();

  // unstable_cache only works inside a Next.js request/runtime. Scripts and
  // one-off tooling fall through to a direct build.
  try {
    const cached = await unstable_cache(
      () => buildCachedProfile(login),
      // v4: rarity-first ability ladder; move ids still hydrated from MOVE_BANK on read.
      ["pokegit-profile", "v4", login],
      { revalidate: 3600, tags: [`profile:${login}`] },
    )();
    return hydrateProfile(cached);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("incrementalCache missing")) {
      return hydrateProfile(await buildCachedProfile(login));
    }
    throw error;
  }
}
