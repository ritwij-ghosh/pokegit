/**
 * The 25-ability decision tree (plan.md section 5).
 *
 * Ordered array, evaluated top-down, first match wins. Order is rarity-first:
 * scarce reach/outlier signals shadow common rhythm and tenure labels so cards
 * diverge more. Earlier entries shadow later ones by design. The final two
 * entries are the safety net, so every profile resolves to exactly one ability.
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
  /** Human-readable gate, for the DEX docs page. Uses live threshold values. */
  condition: string;
  test: (ctx: AbilityContext) => boolean;
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

/** True only when the commit sample is big enough to read rhythm from. */
function hasRhythmSample(ctx: AbilityContext): boolean {
  return ctx.signals.timeOfDay.sampleSize >= T.minCommitSample;
}

export const ABILITIES: AbilityRule[] = [
  {
    name: "Viral Hit",
    description:
      "One repository accounts for nearly all attention received. The rest of the profile sits in its shadow.",
    condition: `Top-repo stars ≥ ${T.viralHitMinTopRepoStars} and star concentration ≥ ${pct(T.viralHitStarConcentration)}`,
    test: (ctx) =>
      ctx.signals.topRepoStars >= T.viralHitMinTopRepoStars &&
      ctx.signals.starConcentration >= T.viralHitStarConcentration,
  },
  {
    name: "Crowd Favorite",
    description:
      "Attention is spread broadly across many repositories rather than resting on one.",
    condition: `Total stars ≥ ${T.crowdFavoriteStars} and star concentration < ${pct(T.crowdFavoriteMaxConcentration)}`,
    test: (ctx) =>
      ctx.signals.totalStars >= T.crowdFavoriteStars &&
      ctx.signals.starConcentration < T.crowdFavoriteMaxConcentration,
  },
  {
    name: "Influencer",
    description:
      "Draws a following disproportionate to the amount of code shipped. Presence outpaces output.",
    condition: `Followers ≥ ${T.influencerMinFollowers} and followers/contribution ≥ ${T.influencerFollowerRatio}`,
    test: (ctx) =>
      ctx.raw.profile.followers >= T.influencerMinFollowers &&
      ctx.signals.followersPerContribution >= T.influencerFollowerRatio,
  },
  {
    name: "Rising Star",
    description:
      "Very new, yet already producing at a level usually seen from far older accounts.",
    condition: `Account age < ${T.risingStarMaxAccountYears} year and (contributions ≥ ${T.risingStarContributions} or stars ≥ ${T.risingStarStars})`,
    test: (ctx) =>
      ctx.signals.accountAgeYears < T.risingStarMaxAccountYears &&
      (ctx.raw.contributions.totalContributions >= T.risingStarContributions ||
        ctx.signals.totalStars >= T.risingStarStars),
  },
  {
    name: "Comeback Kid",
    description:
      "Went fully dormant for months, then returned. Absence does not appear to be permanent.",
    condition: `≥ ${T.dormancyGapDays}-day zero gap that ends in the last ${T.dormancyGapDays} days, then recent activity`,
    test: (ctx) => ctx.signals.streaks.hasComeback,
  },
  {
    name: "Streak Master",
    description:
      "Has sustained contributions for over a hundred consecutive days. Rarely misses a day.",
    condition: `Longest streak ≥ ${T.streakMasterDays} days`,
    test: (ctx) => ctx.signals.streaks.longest >= T.streakMasterDays,
  },
  {
    name: "Prolific",
    description:
      "Contribution volume sits far above typical. Sheer throughput is the defining trait.",
    condition: `Total contributions ≥ ${T.prolificContributions}`,
    test: (ctx) =>
      ctx.raw.contributions.totalContributions >= T.prolificContributions,
  },
  {
    name: "Community Pillar",
    description:
      "Reviews an unusual amount of other people's work. Much of its effort never appears as its own commits.",
    condition: `Reviews given ≥ ${T.communityPillarReviews}`,
    test: (ctx) => ctx.signals.reviewsGiven >= T.communityPillarReviews,
  },
  {
    name: "Mentor",
    description:
      "Reviews widely and is widely followed. Tends to be consulted rather than to ask.",
    condition: `Reviews ≥ ${T.mentorReviews} and followers ≥ ${T.mentorFollowers} (only reachable below Community Pillar)`,
    test: (ctx) =>
      ctx.signals.reviewsGiven >= T.mentorReviews &&
      ctx.raw.profile.followers >= T.mentorFollowers,
  },
  {
    name: "First Responder",
    description:
      "Closes issues within a day of them opening. Reaction time is its sharpest quality.",
    condition: `Median issue turnaround ≤ ${T.firstResponderMaxMedianHours}h and issues opened+closed ≥ ${T.firstResponderMinIssues}`,
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
    condition: `Issues opened+closed ≥ ${T.bugHunterIssues}`,
    test: (ctx) =>
      ctx.raw.totalIssuesOpened + ctx.raw.totalIssuesClosed >= T.bugHunterIssues,
  },
  {
    name: "Perfectionist",
    description:
      "Publishes rarely, but what it publishes lands well. Every repository carries weight.",
    condition: `1–${T.perfectionistMaxRepos} non-fork repos and stars/repo ≥ ${T.perfectionistStarsPerRepo}`,
    test: (ctx) =>
      ctx.signals.nonForkRepoCount > 0 &&
      ctx.signals.nonForkRepoCount <= T.perfectionistMaxRepos &&
      ctx.signals.starsPerRepo >= T.perfectionistStarsPerRepo,
  },
  {
    name: "Architect",
    description:
      "Maintains a large number of separate repositories. Prefers to build systems in pieces.",
    condition: `Non-fork repos ≥ ${T.architectRepoCount}`,
    test: (ctx) => ctx.signals.nonForkRepoCount >= T.architectRepoCount,
  },
  {
    name: "Burst Mode",
    description:
      "Works in violent bursts separated by quiet stretches. Daily output is wildly uneven.",
    condition: `Daily variance CV > ${T.burstVarianceCv}, longest gap < ${T.burstMaxGapDays} days, contributions ≥ ${T.burstMinContributions}`,
    test: (ctx) =>
      ctx.signals.dailyVariance > T.burstVarianceCv &&
      ctx.signals.streaks.longestGap < T.burstMaxGapDays &&
      ctx.raw.contributions.totalContributions >= T.burstMinContributions,
  },
  {
    name: "Steady Grinder",
    description:
      "Maintains an even daily pace with no long absences. Volume comes from persistence, not spikes.",
    condition: `Longest gap ≤ ${T.steadyMaxGapDays} days, daily variance CV < ${T.steadyMaxVarianceCv}, contributions ≥ ${T.steadyMinContributions}`,
    test: (ctx) =>
      ctx.signals.streaks.longestGap <= T.steadyMaxGapDays &&
      ctx.signals.dailyVariance < T.steadyMaxVarianceCv &&
      ctx.raw.contributions.totalContributions >= T.steadyMinContributions,
  },
  {
    name: "Weekend Warrior",
    description:
      "Activity concentrates on Saturday and Sunday. Weekdays are comparatively still.",
    condition: `Weekend contribution share > ${pct(T.weekendShare)}`,
    test: (ctx) => ctx.signals.weekendShare > T.weekendShare,
  },
  {
    name: "Night Owl",
    description:
      "Most work happens after midnight. Output climbs as the rest of the timezone goes quiet.",
    condition: `Commit sample ≥ ${T.minCommitSample} and late-night share > ${pct(T.lateNightShare)}`,
    test: (ctx) =>
      hasRhythmSample(ctx) && ctx.signals.timeOfDay.lateNight > T.lateNightShare,
  },
  {
    name: "Early Bird",
    description:
      "Commits land before the workday starts. Momentum is highest in the first hours after waking.",
    condition: `Commit sample ≥ ${T.minCommitSample} and early-morning share > ${pct(T.earlyBirdShare)}`,
    test: (ctx) =>
      hasRhythmSample(ctx) &&
      ctx.signals.timeOfDay.earlyMorning > T.earlyBirdShare,
  },
  {
    name: "Polyglot",
    description:
      "Splits effort evenly across five or more languages. Shows no strong preference.",
    condition: `Meaningful languages (≥5% each) ≥ ${T.polyglotLanguages} and concentration ≤ ${pct(T.polyglotMaxConcentration)}`,
    test: (ctx) =>
      ctx.signals.meaningfulLanguageCount >= T.polyglotLanguages &&
      ctx.signals.languageConcentration <= T.polyglotMaxConcentration,
  },
  {
    name: "Specialist",
    description:
      "Almost everything it writes is in a single language. Depth is chosen over breadth.",
    condition: `Top language share > ${pct(T.specialistTopShare)}`,
    test: (ctx) => ctx.signals.topLanguageShare > T.specialistTopShare,
  },
  {
    name: "Solo Artist",
    description:
      "Commits steadily but almost never reviews or files issues. Works alone by preference.",
    condition: `Commits ≥ ${T.soloArtistMinCommits}, reviews/commit ≤ ${T.soloArtistMaxReviewsPerCommit}, issues/commit ≤ ${T.soloArtistMaxIssuesPerCommit}`,
    test: (ctx) =>
      ctx.raw.contributions.totalCommitContributions >= T.soloArtistMinCommits &&
      ctx.signals.reviewsPerCommit <= T.soloArtistMaxReviewsPerCommit &&
      ctx.signals.issuesPerCommit <= T.soloArtistMaxIssuesPerCommit,
  },
  {
    name: "Team Player",
    description:
      "Reviews and discussion make up a large share of its activity relative to its own commits.",
    condition: `Commits ≥ ${T.teamPlayerMinCommits} and (reviews+issues)/commits ≥ ${T.teamPlayerCollabRatio}`,
    test: (ctx) =>
      ctx.raw.contributions.totalCommitContributions >= T.teamPlayerMinCommits &&
      ctx.signals.reviewsPerCommit + ctx.signals.issuesPerCommit >=
        T.teamPlayerCollabRatio,
  },
  {
    name: "Veteran",
    description:
      "Has been on the platform for over five years. Habits are long since settled.",
    condition: `Account age ≥ ${T.veteranAccountYears} years`,
    test: (ctx) => ctx.signals.accountAgeYears >= T.veteranAccountYears,
  },
  {
    name: "Balanced",
    description:
      "No single measure stands out in either direction. Reads as evenly developed across the board.",
    condition: `Contributions > ${T.newcomerMaxContributions} and no earlier ability matched`,
    test: (ctx) =>
      ctx.raw.contributions.totalContributions > T.newcomerMaxContributions,
  },
  {
    name: "Newcomer",
    description:
      "Public trail is still short. Not enough recorded behavior to characterize yet.",
    condition: "Always matches (safety net when nothing else fires)",
    test: () => true,
  },
];

/** Plain ability ladder for the DEX docs page (no test functions). */
export const ABILITY_DOCS = ABILITIES.map((rule, index) => ({
  priority: index + 1,
  name: rule.name,
  description: rule.description,
  condition: rule.condition,
}));

export type AbilityDoc = (typeof ABILITY_DOCS)[number];

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
