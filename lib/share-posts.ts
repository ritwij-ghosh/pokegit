import { SITE_ORIGIN } from "@/lib/site";
import type { PokemonType } from "@/lib/types";

/** Snapshot of the profile fields stamped onto social posts / exports. */
export interface ShareCardStats {
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
  total: number;
  primaryType: PokemonType;
  secondaryType: PokemonType | null;
  languageName: string;
  abilityName: string;
  dexNumber: string;
  /** Scouting metrics (raw GitHub signals). */
  contributions: number;
  commits: number;
  reviews: number;
  pullRequestsMerged: number;
  pullRequestsOpened: number;
  issuesClosed: number;
  issuesOpened: number;
  medianIssueTurnaroundHours: number | null;
  totalStars: number;
  topRepoStars: number;
  followers: number;
  publicRepos: number;
}

export interface SharePostContext {
  username: string;
  /** Personal card page, e.g. https://pokegit.com/octocat */
  pageUrl: string;
  /** Site root for "try your own", e.g. https://pokegit.com/ */
  homeUrl: string;
  stats: ShareCardStats;
}

export type SharePlatform = "linkedin" | "x";

type StatKey =
  | "hp"
  | "attack"
  | "defense"
  | "spAttack"
  | "spDefense"
  | "speed";

interface StatHighlight {
  key: StatKey;
  /** Full name for hooks ("Attack"). */
  name: string;
  /** Compact label for body lines ("ATK"). */
  short: string;
  value: number;
}

interface MetricHighlight {
  value: number;
  singular: string;
  plural: string;
}

/** Stats at or above this land in the "elite" hook lane (1–255 scale). */
const ELITE_STAT_THRESHOLD = 160;

const STAT_DEFS: { key: StatKey; name: string; short: string }[] = [
  { key: "hp", name: "HP", short: "HP" },
  { key: "attack", name: "Attack", short: "ATK" },
  { key: "defense", name: "Defense", short: "DEF" },
  { key: "spAttack", name: "Sp. Atk", short: "SpA" },
  { key: "spDefense", name: "Sp. Def", short: "SpD" },
  { key: "speed", name: "Speed", short: "SPE" },
];

/** Abilities that make a punchy, positive one-liner. Bland fallbacks skip this lane. */
const HOOKABLE_ABILITIES = new Set([
  "Night Owl",
  "Early Bird",
  "Weekend Warrior",
  "Comeback Kid",
  "Burst Mode",
  "Streak Master",
  "Steady Grinder",
  "Veteran",
  "Rising Star",
  "Prolific",
  "Viral Hit",
  "Crowd Favorite",
  "Influencer",
  "Community Pillar",
  "Mentor",
  "First Responder",
  "Bug Hunter",
  "Polyglot",
  "Specialist",
  "Architect",
  "Perfectionist",
  "Solo Artist",
  "Team Player",
]);

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""));
}

export function pluralize(
  count: number,
  singular: string,
  plural = `${singular}s`,
): string {
  return `${formatCount(count)} ${count === 1 ? singular : plural}`;
}

function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

function typingLine(stats: ShareCardStats): string {
  return stats.secondaryType
    ? `${stats.primaryType}/${stats.secondaryType}`
    : stats.primaryType;
}

function rankedStats(stats: ShareCardStats): StatHighlight[] {
  return STAT_DEFS.map((def) => ({
    ...def,
    value: stats[def.key],
  })).sort((a, b) => b.value - a.value);
}

/** Top N individual stats by value (most flattering). */
export function topStats(stats: ShareCardStats, n = 2): StatHighlight[] {
  return rankedStats(stats).slice(0, n);
}

function rankedMetrics(stats: ShareCardStats): MetricHighlight[] {
  const candidates: MetricHighlight[] = [
    { value: stats.contributions, singular: "contribution", plural: "contributions" },
    { value: stats.commits, singular: "commit", plural: "commits" },
    { value: stats.totalStars, singular: "star", plural: "stars" },
    { value: stats.followers, singular: "follower", plural: "followers" },
  ];
  return candidates
    .filter((m) => m.value > 0)
    .sort((a, b) => b.value - a.value);
}

/** Top N non-zero GitHub metrics, most impressive first. */
export function topMetrics(stats: ShareCardStats, n = 2): string[] {
  return rankedMetrics(stats)
    .slice(0, n)
    .map((m) => pluralize(m.value, m.singular, m.plural));
}

/** Labeled scouting metrics for story / banner exports (plain-language context). */
export interface ScoutingMetric {
  label: string;
  value: number;
  display: string;
}

/** Top non-zero GitHub signals with full labels, ranked by magnitude. */
export function topScoutingMetrics(
  stats: ShareCardStats,
  n = 4,
): ScoutingMetric[] {
  const candidates: { label: string; value: number }[] = [
    { label: "Contributions", value: stats.contributions },
    { label: "Commits", value: stats.commits },
    { label: "Code reviews", value: stats.reviews },
    { label: "PRs merged", value: stats.pullRequestsMerged },
    { label: "Issues closed", value: stats.issuesClosed },
    { label: "Stars earned", value: stats.totalStars },
    { label: "Followers", value: stats.followers },
    { label: "Public repos", value: stats.publicRepos },
  ];

  return candidates
    .filter((m) => m.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, n)
    .map((m) => ({
      label: m.label,
      value: m.value,
      display: m.value.toLocaleString("en-US"),
    }));
}

function formatMetricLine(metrics: string[]): string {
  return metrics.join(" · ");
}

/**
 * Pick the single most flattering data point and turn it into a one-liner.
 * Deterministic template family; random variant for share-to-share variety.
 */
export function generateHook(stats: ShareCardStats): string {
  const best = rankedStats(stats)[0];
  if (best && best.value >= ELITE_STAT_THRESHOLD) {
    return fill(
      pickRandom([
        "Apparently my {name} stat is elite: {value}.",
        "My {name} stat is basically maxed out.",
        "That {name} of {value} is carrying the whole card.",
        "Didn't expect my {name} to land at {value}.",
        "{name} {value} — yeah, I'll take it.",
      ]),
      { name: best.name, value: best.value },
    );
  }

  if (HOOKABLE_ABILITIES.has(stats.abilityName)) {
    return fill(
      pickRandom([
        "Just found out my GitHub ability is '{ability}'.",
        "PokeGit says my ability is '{ability}'. Hard to argue.",
        "Ability unlocked: '{ability}'.",
        "Turns out I roll '{ability}' as an ability.",
      ]),
      { ability: stats.abilityName },
    );
  }

  const typing = typingLine(stats);
  if (stats.primaryType) {
    return fill(
      pickRandom([
        "Turns out my code is {typing}-type.",
        "Apparently I type as {typing}.",
        "My commit history came back {typing}-type.",
        "Code species confirmed: {typing}.",
      ]),
      { typing },
    );
  }

  const volume = rankedMetrics(stats)[0];
  if (volume) {
    return fill(
      pickRandom([
        "{count} later, I got Pokedex'd.",
        "{count} deep and PokeGit still made a card.",
        "After {count}, the Pokedex finally scanned me.",
      ]),
      { count: pluralize(volume.value, volume.singular, volume.plural) },
    );
  }

  return "just got pokedex'd";
}

function highlightStatLine(stats: ShareCardStats): string {
  return topStats(stats, 2)
    .map((s) => `${s.short} ${s.value}`)
    .join(" · ");
}

/** Formal, scannable post for LinkedIn. */
export function linkedInPostText({
  username,
  pageUrl,
  homeUrl,
  stats,
}: SharePostContext): string {
  const hook = generateHook(stats);
  const typing = typingLine(stats);
  const highlights = highlightStatLine(stats);
  const metrics = topMetrics(stats, 2);
  const metricTail = metrics.length > 0 ? ` · ${formatMetricLine(metrics)}` : "";

  return [
    hook,
    ``,
    `Ran my GitHub through PokeGit — a Pokedex card for your commit history.`,
    ``,
    `@${username} · ${typing}-type`,
    `Ability: ${stats.abilityName}`,
    `BST ${stats.total} · ${highlights}${metricTail}`,
    ``,
    `My card → ${pageUrl}`,
    `Try yours → ${homeUrl}`,
  ].join("\n");
}

/** Shorter, punchier post for X. */
export function xPostText({
  username,
  pageUrl,
  homeUrl,
  stats,
}: SharePostContext): string {
  const hook = generateHook(stats);
  const typing = typingLine(stats);
  const metrics = topMetrics(stats, 1);
  const metricTail = metrics.length > 0 ? ` · ${metrics[0]}` : "";

  const text = [
    hook,
    ``,
    `@${username} · ${typing}`,
    `${stats.abilityName} · BST ${stats.total}${metricTail}`,
    ``,
    `card → ${pageUrl}`,
    `yours → ${homeUrl}`,
  ].join("\n");

  // Soft cap: X allows 280; links count differently, keep body lean.
  if (text.length <= 280) return text;

  return [
    hook,
    ``,
    `@${username} · ${typing} · BST ${stats.total}`,
    ``,
    `card → ${pageUrl}`,
    `yours → ${homeUrl}`,
  ].join("\n");
}

export function xComposeUrl(text: string): string {
  // twitter.com intent is the most reliable handoff to the X app / composer.
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

export function linkedInComposeUrl(text: string): string {
  return `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;
}

/** Open a compose window synchronously from a click handler. */
export function openComposeWindow(url: string): Window | null {
  return window.open(url, "_blank");
}

/**
 * One-click share: hook → lean stats → platform template → compose intent.
 * Returns the opened window, or null if the popup was blocked.
 */
export function sharePost(
  platform: SharePlatform,
  ctx: SharePostContext,
): Window | null {
  const text =
    platform === "linkedin" ? linkedInPostText(ctx) : xPostText(ctx);
  const url =
    platform === "linkedin" ? linkedInComposeUrl(text) : xComposeUrl(text);
  return openComposeWindow(url);
}

export function siteHomeUrl(): string {
  return `${SITE_ORIGIN}/`;
}
