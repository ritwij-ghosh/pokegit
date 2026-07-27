/**
 * Presentation helpers for the DEX docs page.
 * Groups and formats live banks — not a second source of truth for cutoffs.
 *
 * Ability docs live in lib/abilities.ts (`ABILITY_DOCS`) so client move/language
 * components never pull in ability test functions.
 */

import {
  LANGUAGE_TYPE_TABLE,
  POKEMON_TYPE_COLORS,
  languageColor,
} from "@/lib/language-types";
import {
  DEFAULT_MOVES,
  MOVE_BANK,
  type Move,
  type SignalCategory,
} from "@/lib/moves";
import type { PokemonType } from "@/lib/types";

export const ALL_POKEMON_TYPES = Object.keys(
  POKEMON_TYPE_COLORS,
) as PokemonType[];

export interface LanguageTypeEntry {
  language: string;
  type: PokemonType;
  color: string;
}

export function listLanguageTypeEntries(): LanguageTypeEntry[] {
  return Object.entries(LANGUAGE_TYPE_TABLE)
    .map(([language, type]) => ({
      language,
      type,
      color: languageColor(language),
    }))
    .sort((a, b) => a.language.localeCompare(b.language));
}

export const SIGNAL_CATEGORY_META: {
  id: SignalCategory;
  label: string;
}[] = [
  { id: "commit_timing", label: "Commit timing" },
  { id: "streak_consistency", label: "Streak & consistency" },
  { id: "collaboration", label: "Collaboration" },
  { id: "language_stack", label: "Language stack" },
  { id: "repo_scale", label: "Repo scale" },
  { id: "commit_style", label: "Commit style" },
];

export interface SignalLadder {
  signal: string;
  type: PokemonType;
  tiers: Move[];
}

/** Group MOVE_BANK by category, then by signal (tiers ascending). */
export function moveLaddersByCategory(
  category: SignalCategory,
): SignalLadder[] {
  const bySignal = new Map<string, Move[]>();
  for (const move of MOVE_BANK) {
    if (move.category !== category) continue;
    const list = bySignal.get(move.signal) ?? [];
    list.push(move);
    bySignal.set(move.signal, list);
  }

  return [...bySignal.entries()].map(([signal, tiers]) => {
    const sorted = [...tiers].sort((a, b) => a.tier - b.tier);
    return {
      signal,
      type: sorted[0].type,
      tiers: sorted,
    };
  });
}

export function defaultMoveForCategory(category: SignalCategory): Move {
  return DEFAULT_MOVES[category];
}

/** Format a move threshold band for display (e.g. "15% – 30%" or "≥ 100"). */
export function formatMoveThreshold(move: Move): string {
  const { min, max } = move.threshold;
  const metric = move.threshold.metric;
  const isFraction =
    metric.startsWith("pct") ||
    metric.endsWith("Pct") ||
    metric === "languageConcentration" ||
    metric === "starConcentration" ||
    metric === "primaryLanguagePct" ||
    metric === "reviewsPerCommit" ||
    metric === "collabRatio" ||
    metric === "dailyVariance";

  const fmt = (n: number): string => {
    if (metric === "dailyVariance") return String(n);
    if (isFraction && n <= 1) return `${Math.round(n * 100)}%`;
    if (Number.isInteger(n)) return String(n);
    return String(n);
  };

  if (min !== undefined && max !== undefined) {
    return `${fmt(min)} – ${fmt(max)}`;
  }
  if (min !== undefined) return `≥ ${fmt(min)}`;
  if (max !== undefined) return `< ${fmt(max)}`;
  return "—";
}

/** Humanize a snake_case signal id for labels. */
export function formatSignalLabel(signal: string): string {
  return signal
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export type DocsPipelineStageId =
  | "typing"
  | "stats"
  | "ability"
  | "moves"
  | "caveats";

export const DOCS_PIPELINE_STAGES: {
  id: DocsPipelineStageId;
  label: string;
  short: string;
}[] = [
  { id: "typing", label: "Typing", short: "Lang → type" },
  { id: "stats", label: "Base Stats", short: "1–255 curves" },
  { id: "ability", label: "Ability", short: "First match" },
  { id: "moves", label: "Moves", short: "Tier ladders" },
  { id: "caveats", label: "Sampling", short: "Limits" },
];
