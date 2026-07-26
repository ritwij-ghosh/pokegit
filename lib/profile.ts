/**
 * Assembles a complete PokeGit profile: fetch -> derive -> normalize ->
 * classify. Server-side only.
 */

import "server-only";

import { resolveAbility } from "@/lib/abilities";
import { fetchGitHubData } from "@/lib/github";
import { computeBaseStats, computeTyping, deriveSignals } from "@/lib/stats";
import type { PokeGitProfile } from "@/lib/types";

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

export async function getPokeGitProfile(
  username: string,
): Promise<PokeGitProfile> {
  const raw = await fetchGitHubData(username);
  const signals = deriveSignals(raw);
  const stats = computeBaseStats(raw, signals);
  const typing = computeTyping(signals);
  const ability = resolveAbility({ signals, raw });

  return {
    profile: raw.profile,
    stats,
    typing,
    ability,
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
