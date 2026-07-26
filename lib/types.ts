/**
 * Shared types for the PokeGit data pipeline.
 *
 * Flow: lib/github.ts (fetch) -> lib/stats.ts (derive + normalize)
 *       -> lib/abilities.ts (classify) -> lib/flavor-text.ts (narrate)
 */

export type PokemonType =
  | "Normal"
  | "Fire"
  | "Water"
  | "Electric"
  | "Grass"
  | "Ice"
  | "Fighting"
  | "Poison"
  | "Ground"
  | "Flying"
  | "Psychic"
  | "Bug"
  | "Rock"
  | "Ghost"
  | "Dragon"
  | "Dark"
  | "Steel"
  | "Fairy";

export interface GitHubUserProfile {
  login: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  createdAt: string;
  followers: number;
  following: number;
  publicRepoCount: number;
}

export interface ContributionDay {
  /** ISO date, YYYY-MM-DD */
  date: string;
  count: number;
  /** 0 = Sunday ... 6 = Saturday */
  weekday: number;
}

export interface ContributionSummary {
  totalContributions: number;
  totalCommitContributions: number;
  totalPullRequestContributions: number;
  totalPullRequestReviewContributions: number;
  totalIssueContributions: number;
  restrictedContributionsCount: number;
  days: ContributionDay[];
}

export interface RepoSummary {
  name: string;
  fullName: string;
  stars: number;
  forks: number;
  isFork: boolean;
  archived: boolean;
  createdAt: string;
  pushedAt: string | null;
  primaryLanguage: string | null;
  topics: string[];
}

export interface IssueTimingSample {
  createdAt: string;
  closedAt: string | null;
}

export interface RawGitHubData {
  profile: GitHubUserProfile;
  contributions: ContributionSummary;
  repos: RepoSummary[];
  /** Aggregate bytes per language across the sampled repos. */
  languageBytes: Record<string, number>;
  /**
   * Best-effort sample of the user's own recent commit timestamps (ISO), used
   * only for the time-of-day histogram. Not full historical accuracy — see
   * plan.md section 2.
   */
  commitTimestamps: string[];
  issueSamples: IssueTimingSample[];
  totalIssuesOpened: number;
  totalIssuesClosed: number;
  pullRequestsOpened: number;
  pullRequestsMerged: number;
  /** How many repos we actually pulled languages/commits from. */
  reposSampled: number;
  /** True when the owner has more repos than we were willing to page through. */
  repoListTruncated: boolean;
}

export interface LanguageSlice {
  name: string;
  bytes: number;
  share: number;
  color: string;
  pokemonType: PokemonType;
}

export interface StreakInfo {
  longest: number;
  current: number;
  /** Longest run of consecutive zero-contribution days in the window. */
  longestGap: number;
  /** True when a >=90 day dead zone is followed by renewed recent activity. */
  hasComeback: boolean;
  activeDays: number;
}

export interface DerivedSignals {
  accountAgeYears: number;
  languages: LanguageSlice[];
  topLanguage: LanguageSlice | null;
  secondLanguage: LanguageSlice | null;
  /** Languages at >=5% share — what "meaningfully used" means here. */
  meaningfulLanguageCount: number;
  topLanguageShare: number;
  /** 0 = perfectly even across languages, 1 = one language dominates. */
  languageConcentration: number;

  streaks: StreakInfo;
  /** Coefficient of variation of daily contribution counts. */
  dailyVariance: number;
  meanDailyContributions: number;
  maxDailyContributions: number;

  /** Fraction of sampled commits in each bucket. Sums to 1 when sample exists. */
  timeOfDay: {
    lateNight: number; // 00:00-04:59
    earlyMorning: number; // 05:00-08:59
    day: number; // 09:00-17:59
    evening: number; // 18:00-23:59
    sampleSize: number;
  };
  /** Fraction of contributions falling on Sat/Sun. */
  weekendShare: number;

  totalStars: number;
  topRepoStars: number;
  /** topRepoStars / totalStars. 1 = a single repo is the whole story. */
  starConcentration: number;
  starsPerRepo: number;
  nonForkRepoCount: number;

  reviewsGiven: number;
  reviewsPerCommit: number;
  issuesPerCommit: number;
  followersPerContribution: number;
  medianIssueTurnaroundHours: number | null;
}

export interface BaseStats {
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
  total: number;
}

export interface Ability {
  name: string;
  description: string;
}

export interface Typing {
  /** Pokedex entry typing: up to two types. */
  primary: PokemonType;
  secondary: PokemonType | null;
  primaryLanguage: string;
  secondaryLanguage: string | null;
  /** Linguist hex color of the primary language — drives the card palette. */
  color: string;
}

export interface PokeGitProfile {
  profile: GitHubUserProfile;
  stats: BaseStats;
  typing: Typing;
  ability: Ability;
  signals: DerivedSignals;
  raw: {
    totalContributions: number;
    commits: number;
    reviews: number;
    issuesOpened: number;
    issuesClosed: number;
    pullRequestsOpened: number;
    pullRequestsMerged: number;
    totalStars: number;
    topRepoStars: number;
    followers: number;
    publicRepos: number;
  };
  /** Notes about approximations made while fetching, surfaced in the UI. */
  caveats: string[];
}
