/**
 * Derived signals + base stat normalization (plan.md sections 2-4).
 *
 * Every stat is normalized onto a 1-255 scale on a log curve. See
 * STAT_CURVES below for how the constants were picked.
 */

import {
  canonicalLanguageName,
  isProgrammingLanguage,
  languageColor,
  languageToPokemonType,
} from "@/lib/language-types";
import type {
  BaseStats,
  DerivedSignals,
  LanguageSlice,
  RawGitHubData,
  StreakInfo,
  Typing,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

interface StatCurve {
  /** Raw value at which the stat saturates near 255. */
  ceiling: number;
  /**
   * Curve shaping exponent applied to the log-normalized value.
   * 1.0 is a plain log scale; >1 pushes the mid-range down.
   */
  gamma: number;
}

/**
 * stat = 255 * (ln(raw + 1) / ln(ceiling + 1)) ^ gamma, clamped to 1..255.
 *
 * plan.md section 3 specifies `k * log(raw + 1)` with k tuned per stat, and
 * gives three anchor profiles: a heavy OSS maintainer at ~200-230, a casual
 * contributor at ~60-100, and a near-inactive account at ~20-40. A single
 * multiplicative k cannot hit all three anchors at once — plain log is too
 * flat, so any k that puts the maintainer at 210 drags the casual profile up
 * into the 140s. Adding the gamma exponent keeps the curve logarithmic while
 * letting both ends land where the plan asks. ceiling/gamma per stat were
 * solved from the maintainer and casual anchors, then checked against the
 * inactive anchor and a full sweep of raw values.
 *
 * Expected to be retuned once real distributions are visible (plan.md s.11).
 */
const STAT_CURVES = {
  /** Total contributions, past year. 5000 -> 210, 300 -> 80, 20 -> 18. */
  hp: { ceiling: 10000, gamma: 2.41 },
  /** Total commit count, past year. 3000 -> 210, 250 -> 80, 15 -> 13. */
  attack: { ceiling: 5500, gamma: 2.6 },
  /** Aggregate stars + top-repo reach. 20k -> 215, 100 -> 70, 0 -> 1. */
  spAttack: { ceiling: 68000, gamma: 1.47 },
  /** Code reviews given. 800 -> 205, 25 -> 70, 0 -> 1. */
  defense: { ceiling: 2300, gamma: 1.5 },
  /** Follower count. 5000 -> 210, 100 -> 75, 2 -> 7. */
  spDefense: { ceiling: 14000, gamma: 1.68 },
  /** Issue volume weighted by turnaround. 900 -> 210, 50 -> 70, 0 -> 1. */
  speed: { ceiling: 1800, gamma: 2.0 },
} satisfies Record<string, StatCurve>;

export function normalizeStat(raw: number, curve: StatCurve): number {
  if (!Number.isFinite(raw) || raw <= 0) return 1;
  const unit = Math.log(raw + 1) / Math.log(curve.ceiling + 1);
  const scaled = 255 * Math.pow(unit, curve.gamma);
  return Math.max(1, Math.min(255, Math.round(scaled)));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function safeRatio(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}

// ---------------------------------------------------------------------------
// Derived signals
// ---------------------------------------------------------------------------

function computeLanguages(
  languageBytes: Record<string, number>,
): LanguageSlice[] {
  // Markup/data/prose (HTML, JSON, TeX...) inflates byte counts and would make
  // almost everyone an HTML developer. Keep only real programming languages
  // when there is at least one; otherwise fall back to whatever exists.
  const entries = Object.entries(languageBytes).filter(([, bytes]) => bytes > 0);
  const programming = entries.filter(([name]) => isProgrammingLanguage(name));
  const pool = programming.length > 0 ? programming : entries;

  const total = pool.reduce((sum, [, bytes]) => sum + bytes, 0);
  if (total === 0) return [];

  return pool
    .map(([name, bytes]) => {
      const canonical = canonicalLanguageName(name);
      return {
        name: canonical,
        bytes,
        share: bytes / total,
        color: languageColor(canonical),
        pokemonType: languageToPokemonType(canonical),
      };
    })
    .sort((a, b) => b.bytes - a.bytes);
}

/** 0 = perfectly even spread across languages, 1 = a single language. */
function languageConcentration(slices: LanguageSlice[]): number {
  if (slices.length <= 1) return 1;
  const entropy = -slices.reduce(
    (sum, slice) => (slice.share > 0 ? sum + slice.share * Math.log(slice.share) : sum),
    0,
  );
  const evenness = entropy / Math.log(slices.length);
  return clamp(1 - evenness, 0, 1);
}

function computeStreaks(days: RawGitHubData["contributions"]["days"]): StreakInfo {
  const ordered = [...days].sort((a, b) => a.date.localeCompare(b.date));

  let longest = 0;
  let running = 0;
  let longestGap = 0;
  let gapRun = 0;
  let activeDays = 0;
  let comebackGapEndIndex = -1;

  ordered.forEach((day, index) => {
    if (day.count > 0) {
      running += 1;
      activeDays += 1;
      longest = Math.max(longest, running);
      if (gapRun >= 90) comebackGapEndIndex = index;
      gapRun = 0;
    } else {
      running = 0;
      gapRun += 1;
      longestGap = Math.max(longestGap, gapRun);
    }
  });

  // Current streak counts backwards from the most recent day. Today often has
  // no contributions yet, so an empty final day does not break the streak.
  let current = 0;
  for (let i = ordered.length - 1; i >= 0; i--) {
    if (ordered[i].count > 0) current += 1;
    else if (i === ordered.length - 1) continue;
    else break;
  }

  const recentWindow = ordered.slice(-90);
  const recentActivity = recentWindow.reduce((sum, d) => sum + d.count, 0);
  const hasComeback =
    comebackGapEndIndex >= 0 &&
    comebackGapEndIndex >= ordered.length - 90 &&
    recentActivity > 0;

  return { longest, current, longestGap, hasComeback, activeDays };
}

/**
 * Hour histogram from the best-effort commit sample.
 *
 * Git author dates carry the committer's own UTC offset, so the hour written
 * in the timestamp is already the developer's local time. Reading it off the
 * string avoids Date() normalizing everything to the server's timezone.
 */
function computeTimeOfDay(timestamps: string[]): DerivedSignals["timeOfDay"] {
  const buckets = { lateNight: 0, earlyMorning: 0, day: 0, evening: 0 };
  let counted = 0;

  for (const timestamp of timestamps) {
    const match = /T(\d{2}):/.exec(timestamp);
    if (!match) continue;
    const hour = Number(match[1]);
    if (!Number.isFinite(hour)) continue;
    counted += 1;
    if (hour < 5) buckets.lateNight += 1;
    else if (hour < 9) buckets.earlyMorning += 1;
    else if (hour < 18) buckets.day += 1;
    else buckets.evening += 1;
  }

  if (counted === 0) {
    return { lateNight: 0, earlyMorning: 0, day: 0, evening: 0, sampleSize: 0 };
  }
  return {
    lateNight: buckets.lateNight / counted,
    earlyMorning: buckets.earlyMorning / counted,
    day: buckets.day / counted,
    evening: buckets.evening / counted,
    sampleSize: counted,
  };
}

function medianTurnaroundHours(
  samples: RawGitHubData["issueSamples"],
): number | null {
  const durations = samples
    .filter((s) => s.closedAt)
    .map(
      (s) =>
        (new Date(s.closedAt as string).getTime() -
          new Date(s.createdAt).getTime()) /
        3_600_000,
    )
    .filter((hours) => Number.isFinite(hours) && hours >= 0)
    .sort((a, b) => a - b);

  if (durations.length < 3) return null;
  const mid = Math.floor(durations.length / 2);
  return durations.length % 2
    ? durations[mid]
    : (durations[mid - 1] + durations[mid]) / 2;
}

export function deriveSignals(raw: RawGitHubData): DerivedSignals {
  const languages = computeLanguages(raw.languageBytes);
  const meaningful = languages.filter((l) => l.share >= 0.05);

  const days = raw.contributions.days;
  const counts = days.map((d) => d.count);
  const meanDaily = counts.length
    ? counts.reduce((a, b) => a + b, 0) / counts.length
    : 0;
  const variance = counts.length
    ? counts.reduce((sum, c) => sum + (c - meanDaily) ** 2, 0) / counts.length
    : 0;
  const stdDev = Math.sqrt(variance);

  const weekendContributions = days
    .filter((d) => d.weekday === 0 || d.weekday === 6)
    .reduce((sum, d) => sum + d.count, 0);
  const totalCalendar = counts.reduce((a, b) => a + b, 0);

  const ownRepos = raw.repos.filter((r) => !r.isFork);
  const totalStars = ownRepos.reduce((sum, r) => sum + r.stars, 0);
  const topRepoStars = ownRepos.reduce((max, r) => Math.max(max, r.stars), 0);

  const commits = raw.contributions.totalCommitContributions;
  const reviews = raw.contributions.totalPullRequestReviewContributions;
  const issues = raw.contributions.totalIssueContributions;

  const accountAgeYears =
    (Date.now() - new Date(raw.profile.createdAt).getTime()) /
    (365.25 * 24 * 3_600_000);

  return {
    accountAgeYears,
    languages,
    topLanguage: languages[0] ?? null,
    secondLanguage: languages[1] ?? null,
    meaningfulLanguageCount: meaningful.length,
    topLanguageShare: languages[0]?.share ?? 0,
    languageConcentration: languageConcentration(languages),

    streaks: computeStreaks(days),
    dailyVariance: safeRatio(stdDev, meanDaily),
    meanDailyContributions: meanDaily,
    maxDailyContributions: counts.length ? Math.max(...counts) : 0,

    timeOfDay: computeTimeOfDay(raw.commitTimestamps),
    weekendShare: safeRatio(weekendContributions, totalCalendar),

    totalStars,
    topRepoStars,
    starConcentration: safeRatio(topRepoStars, totalStars),
    starsPerRepo: safeRatio(totalStars, ownRepos.length),
    nonForkRepoCount: ownRepos.length,

    reviewsGiven: reviews,
    reviewsPerCommit: safeRatio(reviews, commits),
    issuesPerCommit: safeRatio(issues, commits),
    followersPerContribution: safeRatio(
      raw.profile.followers,
      raw.contributions.totalContributions,
    ),
    medianIssueTurnaroundHours: medianTurnaroundHours(raw.issueSamples),
  };
}

// ---------------------------------------------------------------------------
// Base stats
// ---------------------------------------------------------------------------

/**
 * Speed's raw signal blends issue throughput with responsiveness: volume is
 * the base, and a fast median turnaround multiplies it up to 2x while a
 * week-or-slower turnaround leaves it untouched.
 */
function rawSpeedSignal(raw: RawGitHubData, signals: DerivedSignals): number {
  const volume = raw.totalIssuesOpened + raw.totalIssuesClosed;
  const median = signals.medianIssueTurnaroundHours;
  const boost =
    median === null ? 1 : 1 + clamp((168 - median) / 168, 0, 1);
  return volume * boost;
}

export function computeBaseStats(
  raw: RawGitHubData,
  signals: DerivedSignals,
): BaseStats {
  const hp = normalizeStat(
    raw.contributions.totalContributions,
    STAT_CURVES.hp,
  );
  const attack = normalizeStat(
    raw.contributions.totalCommitContributions,
    STAT_CURVES.attack,
  );
  // "Star reach" counts the top repo twice on purpose: a single breakout repo
  // is a different kind of reach than the same stars spread thin.
  const spAttack = normalizeStat(
    signals.totalStars + signals.topRepoStars,
    STAT_CURVES.spAttack,
  );
  const defense = normalizeStat(signals.reviewsGiven, STAT_CURVES.defense);
  const spDefense = normalizeStat(raw.profile.followers, STAT_CURVES.spDefense);
  const speed = normalizeStat(rawSpeedSignal(raw, signals), STAT_CURVES.speed);

  return {
    hp,
    attack,
    defense,
    spAttack,
    spDefense,
    speed,
    total: hp + attack + defense + spAttack + spDefense + speed,
  };
}

// ---------------------------------------------------------------------------
// Typing
// ---------------------------------------------------------------------------

/** Below this share the #2 language is not a meaningful secondary type. */
const SECONDARY_TYPE_MIN_SHARE = 0.05;

export function computeTyping(signals: DerivedSignals): Typing {
  const top = signals.topLanguage;
  const second = signals.secondLanguage;

  if (!top) {
    // Empty or language-less profile: Normal type, neutral grey.
    return {
      primary: "Normal",
      secondary: null,
      primaryLanguage: "Unknown",
      secondaryLanguage: null,
      color: "#8b949e",
    };
  }

  const secondaryQualifies =
    !!second &&
    second.share >= SECONDARY_TYPE_MIN_SHARE &&
    second.pokemonType !== top.pokemonType;

  return {
    primary: top.pokemonType,
    secondary: secondaryQualifies ? second.pokemonType : null,
    primaryLanguage: top.name,
    secondaryLanguage: secondaryQualifies ? second.name : null,
    color: top.color,
  };
}
