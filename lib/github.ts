/**
 * GitHub data fetching. Server-side only.
 *
 * Per plan.md section 2:
 *  - GraphQL for the contribution calendar and full-year aggregate counts.
 *  - REST for the repo list, per-repo languages and stars.
 *  - No user OAuth. Anonymous lookup by username with one app-owned PAT.
 *  - The `/events` feed is deliberately not used.
 */

import "server-only";

import type {
  ContributionDay,
  IssueTimingSample,
  RawGitHubData,
  RepoSummary,
} from "@/lib/types";

const GRAPHQL_ENDPOINT = "https://api.github.com/graphql";
const REST_ROOT = "https://api.github.com";

/** How many repos we pull a per-language byte breakdown for. */
const LANGUAGE_SAMPLE_REPOS = 40;
/** How many repos we sample commit timestamps from for the hour histogram. */
const COMMIT_SAMPLE_REPOS = 5;
/**
 * Max repos listed. REST cannot sort by stars, so aggregate star counts are
 * only correct if we walk the whole list — hence a high cap rather than a
 * cheap first-page sample.
 */
const MAX_REPO_PAGES = 10;
const REPOS_PER_PAGE = 100;

export class GitHubError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

export class UserNotFoundError extends GitHubError {
  constructor(login: string) {
    super(`No GitHub user named "${login}".`, 404);
    this.name = "UserNotFoundError";
  }
}

function token(): string {
  const value = process.env.GITHUB_TOKEN;
  if (!value || value.startsWith("ghp_your_token")) {
    throw new GitHubError(
      "GITHUB_TOKEN is not configured. Copy .env.local.example to .env.local and add a token.",
      500,
    );
  }
  return value;
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${token()}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "pokegit",
  };
}

/** Fetch with one retry on transient upstream failures. */
async function githubFetch(url: string, init?: RequestInit): Promise<Response> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch(url, {
      ...init,
      headers: { ...headers(), ...(init?.headers ?? {}) },
      cache: "no-store",
    });
    if (response.status >= 500 && attempt === 0) continue;
    return response;
  }
  throw new GitHubError("GitHub is not responding.", 502);
}

/** Run async work over a list with bounded concurrency. */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index]);
    }
  });
  await Promise.all(runners);
  return results;
}

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------

const PROFILE_QUERY = /* GraphQL */ `
  query ProfileQuery($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      login
      name
      avatarUrl(size: 460)
      bio
      createdAt
      followers {
        totalCount
      }
      following {
        totalCount
      }
      repositories(privacy: PUBLIC, ownerAffiliations: OWNER) {
        totalCount
      }
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalIssueContributions
        restrictedContributionsCount
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              weekday
            }
          }
        }
      }
      openedPullRequests: pullRequests {
        totalCount
      }
      mergedPullRequests: pullRequests(states: MERGED) {
        totalCount
      }
      openedIssues: issues {
        totalCount
      }
      closedIssues: issues(states: CLOSED) {
        totalCount
      }
      issueSamples: issues(
        first: 50
        states: CLOSED
        orderBy: { field: CREATED_AT, direction: DESC }
      ) {
        nodes {
          createdAt
          closedAt
        }
      }
    }
  }
`;

interface GraphQLProfileResponse {
  data?: {
    user: {
      login: string;
      name: string | null;
      avatarUrl: string;
      bio: string | null;
      createdAt: string;
      followers: { totalCount: number };
      following: { totalCount: number };
      repositories: { totalCount: number };
      contributionsCollection: {
        totalCommitContributions: number;
        totalPullRequestContributions: number;
        totalPullRequestReviewContributions: number;
        totalIssueContributions: number;
        restrictedContributionsCount: number;
        contributionCalendar: {
          totalContributions: number;
          weeks: {
            contributionDays: {
              date: string;
              contributionCount: number;
              weekday: number;
            }[];
          }[];
        };
      };
      openedPullRequests: { totalCount: number };
      mergedPullRequests: { totalCount: number };
      openedIssues: { totalCount: number };
      closedIssues: { totalCount: number };
      issueSamples: { nodes: { createdAt: string; closedAt: string | null }[] };
    } | null;
  };
  errors?: { type?: string; message: string }[];
}

async function fetchGraphQLProfile(login: string) {
  const to = new Date();
  const from = new Date(to);
  from.setUTCFullYear(from.getUTCFullYear() - 1);

  const response = await githubFetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: PROFILE_QUERY,
      variables: {
        login,
        from: from.toISOString(),
        to: to.toISOString(),
      },
    }),
  });

  if (response.status === 401) {
    throw new GitHubError("GitHub rejected the configured token.", 401);
  }
  if (!response.ok) {
    throw new GitHubError(`GitHub GraphQL request failed.`, response.status);
  }

  const payload = (await response.json()) as GraphQLProfileResponse;

  if (payload.errors?.some((e) => e.type === "NOT_FOUND")) {
    throw new UserNotFoundError(login);
  }
  if (payload.errors?.length) {
    throw new GitHubError(payload.errors[0].message, 502);
  }
  if (!payload.data?.user) {
    throw new UserNotFoundError(login);
  }
  return payload.data.user;
}

// ---------------------------------------------------------------------------
// REST
// ---------------------------------------------------------------------------

interface RestRepo {
  name: string;
  full_name: string;
  fork: boolean;
  archived: boolean;
  stargazers_count: number;
  forks_count: number;
  created_at: string;
  pushed_at: string | null;
  language: string | null;
  topics?: string[];
  languages_url: string;
}

async function fetchRepos(
  login: string,
): Promise<{ repos: RestRepo[]; truncated: boolean }> {
  const repos: RestRepo[] = [];
  let truncated = false;

  for (let page = 1; page <= MAX_REPO_PAGES; page++) {
    const response = await githubFetch(
      `${REST_ROOT}/users/${encodeURIComponent(login)}/repos` +
        `?per_page=${REPOS_PER_PAGE}&page=${page}&type=owner&sort=pushed`,
    );
    if (response.status === 404) throw new UserNotFoundError(login);
    if (!response.ok) {
      throw new GitHubError("Could not list repositories.", response.status);
    }
    const batch = (await response.json()) as RestRepo[];
    repos.push(...batch);
    if (batch.length < REPOS_PER_PAGE) return { repos, truncated: false };
    if (page === MAX_REPO_PAGES) truncated = true;
  }
  return { repos, truncated };
}

async function fetchLanguageBytes(
  repos: RestRepo[],
): Promise<Record<string, number>> {
  const totals: Record<string, number> = {};
  const breakdowns = await mapLimit(repos, 8, async (repo) => {
    const response = await githubFetch(repo.languages_url);
    if (!response.ok) return {} as Record<string, number>;
    return (await response.json()) as Record<string, number>;
  });
  for (const breakdown of breakdowns) {
    for (const [language, bytes] of Object.entries(breakdown)) {
      totals[language] = (totals[language] ?? 0) + bytes;
    }
  }
  return totals;
}

interface CommitSample {
  timestamps: string[];
  messageLengths: number[];
}

/**
 * Best-effort commit sample for the time-of-day histogram and commit-style
 * signals (message length).
 *
 * The GraphQL contribution calendar is daily-granularity only, so hour-level
 * patterns have to come from actual commit objects. This samples the user's own
 * commits from their most recently pushed repos — an approximation, not a
 * complete history (plan.md section 2 calls this out explicitly).
 *
 * Timestamps are read from the git author date, which carries the committer's
 * local timezone offset, so the hour reflects the developer's own clock.
 */
async function fetchCommitSample(
  login: string,
  repos: RestRepo[],
): Promise<CommitSample> {
  const sampled = await mapLimit(repos, 3, async (repo) => {
    const response = await githubFetch(
      `${REST_ROOT}/repos/${repo.full_name}/commits` +
        `?author=${encodeURIComponent(login)}&per_page=100`,
    );
    if (!response.ok) {
      return { timestamps: [] as string[], messageLengths: [] as number[] };
    }
    const commits = (await response.json()) as {
      commit?: { author?: { date?: string }; message?: string };
    }[];

    const timestamps: string[] = [];
    const messageLengths: number[] = [];
    for (const entry of commits) {
      const date = entry.commit?.author?.date;
      if (typeof date === "string") timestamps.push(date);
      const message = entry.commit?.message;
      if (typeof message === "string") {
        // Subject line only — first line before a blank/body break.
        const subject = message.split("\n", 1)[0]?.trim() ?? "";
        messageLengths.push(subject.length);
      }
    }
    return { timestamps, messageLengths };
  });

  return {
    timestamps: sampled.flatMap((s) => s.timestamps),
    messageLengths: sampled.flatMap((s) => s.messageLengths),
  };
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export async function fetchGitHubData(
  username: string,
): Promise<RawGitHubData> {
  const login = username.trim().replace(/^@/, "");
  if (!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(login)) {
    throw new GitHubError(`"${username}" is not a valid GitHub username.`, 400);
  }

  const [user, repoList] = await Promise.all([
    fetchGraphQLProfile(login),
    fetchRepos(login),
  ]);
  const restRepos = repoList.repos;

  // Own work first: non-forks, most-starred, for language and commit sampling.
  const ownRepos = restRepos.filter((r) => !r.fork);
  const byStars = [...ownRepos].sort(
    (a, b) => b.stargazers_count - a.stargazers_count,
  );
  const byRecency = [...ownRepos].sort((a, b) =>
    (b.pushed_at ?? "").localeCompare(a.pushed_at ?? ""),
  );

  const languageTargets = byStars.slice(0, LANGUAGE_SAMPLE_REPOS);
  const commitTargets = byRecency.slice(0, COMMIT_SAMPLE_REPOS);

  const [languageBytes, commitSample] = await Promise.all([
    fetchLanguageBytes(languageTargets),
    fetchCommitSample(login, commitTargets),
  ]);

  const calendar = user.contributionsCollection.contributionCalendar;
  const days: ContributionDay[] = calendar.weeks.flatMap((week) =>
    week.contributionDays.map((day) => ({
      date: day.date,
      count: day.contributionCount,
      weekday: day.weekday,
    })),
  );

  const repos: RepoSummary[] = restRepos.map((repo) => ({
    name: repo.name,
    fullName: repo.full_name,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    isFork: repo.fork,
    archived: repo.archived,
    createdAt: repo.created_at,
    pushedAt: repo.pushed_at,
    primaryLanguage: repo.language,
    topics: repo.topics ?? [],
  }));

  const issueSamples: IssueTimingSample[] = user.issueSamples.nodes.map(
    (node) => ({ createdAt: node.createdAt, closedAt: node.closedAt }),
  );

  return {
    profile: {
      login: user.login,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      createdAt: user.createdAt,
      followers: user.followers.totalCount,
      following: user.following.totalCount,
      publicRepoCount: user.repositories.totalCount,
    },
    contributions: {
      totalContributions: calendar.totalContributions,
      totalCommitContributions:
        user.contributionsCollection.totalCommitContributions,
      totalPullRequestContributions:
        user.contributionsCollection.totalPullRequestContributions,
      totalPullRequestReviewContributions:
        user.contributionsCollection.totalPullRequestReviewContributions,
      totalIssueContributions:
        user.contributionsCollection.totalIssueContributions,
      restrictedContributionsCount:
        user.contributionsCollection.restrictedContributionsCount,
      days,
    },
    repos,
    languageBytes,
    commitTimestamps: commitSample.timestamps,
    commitMessageLengths: commitSample.messageLengths,
    issueSamples,
    totalIssuesOpened: user.openedIssues.totalCount,
    totalIssuesClosed: user.closedIssues.totalCount,
    pullRequestsOpened: user.openedPullRequests.totalCount,
    pullRequestsMerged: user.mergedPullRequests.totalCount,
    reposSampled: languageTargets.length,
    repoListTruncated: repoList.truncated,
  };
}
