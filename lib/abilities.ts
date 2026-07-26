/**
 * The 25-ability decision tree (plan.md section 5).
 *
 * Ordered array, evaluated top-down, first match wins. Order is exactly the
 * order given in plan.md — it is load-bearing, since earlier entries shadow
 * later ones by design. The final two entries are the safety net, so every
 * profile resolves to exactly one ability.
 *
 * All cutoffs live in lib/ability-thresholds.ts.
 */

import { ABILITY_THRESHOLDS as T } from "@/lib/ability-thresholds";
import type { Ability, DerivedSignals, RawGitHubData } from "@/lib/types";

export interface AbilityContext {
  signals: DerivedSignals;
  raw: RawGitHubData;
}

interface AbilityRule extends Ability {
  test: (ctx: AbilityContext) => boolean;
}

/** True only when the commit sample is big enough to read rhythm from. */
function hasRhythmSample(ctx: AbilityContext): boolean {
  return ctx.signals.timeOfDay.sampleSize >= T.minCommitSample;
}

export const ABILITIES: AbilityRule[] = [
  {
    name: "Night Owl",
    description:
      "Most work happens after midnight. Output climbs as the rest of the timezone goes quiet.",
    test: (ctx) =>
      hasRhythmSample(ctx) && ctx.signals.timeOfDay.lateNight > T.lateNightShare,
  },
  {
    name: "Early Bird",
    description:
      "Commits land before the workday starts. Momentum is highest in the first hours after waking.",
    test: (ctx) =>
      hasRhythmSample(ctx) &&
      ctx.signals.timeOfDay.earlyMorning > T.earlyBirdShare,
  },
  {
    name: "Weekend Warrior",
    description:
      "Activity concentrates on Saturday and Sunday. Weekdays are comparatively still.",
    test: (ctx) => ctx.signals.weekendShare > T.weekendShare,
  },
  {
    name: "Comeback Kid",
    description:
      "Went fully dormant for months, then returned. Absence does not appear to be permanent.",
    test: (ctx) => ctx.signals.streaks.hasComeback,
  },
  {
    name: "Burst Mode",
    description:
      "Works in violent bursts separated by quiet stretches. Daily output is wildly uneven.",
    test: (ctx) =>
      ctx.signals.dailyVariance > T.burstVarianceCv &&
      ctx.signals.streaks.longestGap < T.burstMaxGapDays &&
      ctx.raw.contributions.totalContributions >= T.burstMinContributions,
  },
  {
    name: "Streak Master",
    description:
      "Has sustained contributions for over a hundred consecutive days. Rarely misses a day.",
    test: (ctx) => ctx.signals.streaks.longest >= T.streakMasterDays,
  },
  {
    name: "Steady Grinder",
    description:
      "Maintains an even daily pace with no long absences. Volume comes from persistence, not spikes.",
    test: (ctx) =>
      ctx.signals.streaks.longestGap <= T.steadyMaxGapDays &&
      ctx.signals.dailyVariance < T.steadyMaxVarianceCv &&
      ctx.raw.contributions.totalContributions >= T.steadyMinContributions,
  },
  {
    name: "Veteran",
    description:
      "Has been on the platform for over five years. Habits are long since settled.",
    test: (ctx) => ctx.signals.accountAgeYears >= T.veteranAccountYears,
  },
  {
    name: "Rising Star",
    description:
      "Very new, yet already producing at a level usually seen from far older accounts.",
    test: (ctx) =>
      ctx.signals.accountAgeYears < T.risingStarMaxAccountYears &&
      (ctx.raw.contributions.totalContributions >= T.risingStarContributions ||
        ctx.signals.totalStars >= T.risingStarStars),
  },
  {
    name: "Prolific",
    description:
      "Contribution volume sits far above typical. Sheer throughput is the defining trait.",
    test: (ctx) =>
      ctx.raw.contributions.totalContributions >= T.prolificContributions,
  },
  {
    name: "Viral Hit",
    description:
      "One repository accounts for nearly all attention received. The rest of the profile sits in its shadow.",
    test: (ctx) =>
      ctx.signals.topRepoStars >= T.viralHitMinTopRepoStars &&
      ctx.signals.starConcentration >= T.viralHitStarConcentration,
  },
  {
    name: "Crowd Favorite",
    description:
      "Attention is spread broadly across many repositories rather than resting on one.",
    test: (ctx) =>
      ctx.signals.totalStars >= T.crowdFavoriteStars &&
      ctx.signals.starConcentration < T.crowdFavoriteMaxConcentration,
  },
  {
    name: "Influencer",
    description:
      "Draws a following disproportionate to the amount of code shipped. Presence outpaces output.",
    test: (ctx) =>
      ctx.raw.profile.followers >= T.influencerMinFollowers &&
      ctx.signals.followersPerContribution >= T.influencerFollowerRatio,
  },
  {
    name: "Community Pillar",
    description:
      "Reviews an unusual amount of other people's work. Much of its effort never appears as its own commits.",
    test: (ctx) => ctx.signals.reviewsGiven >= T.communityPillarReviews,
  },
  {
    name: "Mentor",
    description:
      "Reviews widely and is widely followed. Tends to be consulted rather than to ask.",
    test: (ctx) =>
      ctx.signals.reviewsGiven >= T.mentorReviews &&
      ctx.raw.profile.followers >= T.mentorFollowers,
  },
  {
    name: "First Responder",
    description:
      "Closes issues within a day of them opening. Reaction time is its sharpest quality.",
    test: (ctx) =>
      ctx.signals.medianIssueTurnaroundHours !== null &&
      ctx.signals.medianIssueTurnaroundHours <= T.firstResponderMaxMedianHours &&
      ctx.raw.totalIssuesOpened + ctx.raw.totalIssuesClosed >=
        T.firstResponderMinIssues,
  },
  {
    name: "Bug Hunter",
    description:
      "Files and works through a high volume of issues, though not always quickly.",
    test: (ctx) =>
      ctx.raw.totalIssuesOpened + ctx.raw.totalIssuesClosed >= T.bugHunterIssues,
  },
  {
    name: "Polyglot",
    description:
      "Splits effort evenly across five or more languages. Shows no strong preference.",
    test: (ctx) =>
      ctx.signals.meaningfulLanguageCount >= T.polyglotLanguages &&
      ctx.signals.languageConcentration <= T.polyglotMaxConcentration,
  },
  {
    name: "Specialist",
    description:
      "Almost everything it writes is in a single language. Depth is chosen over breadth.",
    test: (ctx) => ctx.signals.topLanguageShare > T.specialistTopShare,
  },
  {
    name: "Architect",
    description:
      "Maintains a large number of separate repositories. Prefers to build systems in pieces.",
    test: (ctx) => ctx.signals.nonForkRepoCount >= T.architectRepoCount,
  },
  {
    name: "Perfectionist",
    description:
      "Publishes rarely, but what it publishes lands well. Every repository carries weight.",
    test: (ctx) =>
      ctx.signals.nonForkRepoCount > 0 &&
      ctx.signals.nonForkRepoCount <= T.perfectionistMaxRepos &&
      ctx.signals.starsPerRepo >= T.perfectionistStarsPerRepo,
  },
  {
    name: "Solo Artist",
    description:
      "Commits steadily but almost never reviews or files issues. Works alone by preference.",
    test: (ctx) =>
      ctx.raw.contributions.totalCommitContributions >= T.soloArtistMinCommits &&
      ctx.signals.reviewsPerCommit <= T.soloArtistMaxReviewsPerCommit &&
      ctx.signals.issuesPerCommit <= T.soloArtistMaxIssuesPerCommit,
  },
  {
    name: "Team Player",
    description:
      "Reviews and discussion make up a large share of its activity relative to its own commits.",
    test: (ctx) =>
      ctx.raw.contributions.totalCommitContributions >= T.teamPlayerMinCommits &&
      ctx.signals.reviewsPerCommit + ctx.signals.issuesPerCommit >=
        T.teamPlayerCollabRatio,
  },
  {
    name: "Balanced",
    description:
      "No single measure stands out in either direction. Reads as evenly developed across the board.",
    test: (ctx) =>
      ctx.raw.contributions.totalContributions > T.newcomerMaxContributions,
  },
  {
    name: "Newcomer",
    description:
      "Public trail is still short. Not enough recorded behavior to characterize yet.",
    test: () => true,
  },
];

export function resolveAbility(ctx: AbilityContext): Ability {
  for (const rule of ABILITIES) {
    let matched = false;
    try {
      matched = rule.test(ctx);
    } catch {
      matched = false;
    }
    if (matched) return { name: rule.name, description: rule.description };
  }
  // Unreachable: the last rule always matches.
  const fallback = ABILITIES[ABILITIES.length - 1];
  return { name: fallback.name, description: fallback.description };
}

/**
 * Which abilities a profile *would* have matched, ignoring order.
 * Useful for debugging threshold tuning and for grounding the flavor-text prompt.
 */
export function allMatchingAbilities(ctx: AbilityContext): string[] {
  return ABILITIES.filter((rule) => {
    try {
      return rule.test(ctx);
    } catch {
      return false;
    }
  }).map((rule) => rule.name);
}
