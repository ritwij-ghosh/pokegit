# PokeGit Personalized Moves — Implementation Spec

## Overview
Each card gets 2 personalized "moves" selected from a fixed bank of 50, based on signals derived from the user's GitHub data. Moves are picked via a decision tree, not generated live by an LLM.

## 1. Move Bank Structure (`moves.ts`)

Hardcoded, typed, versioned in git — not a database.

```ts
type SignalCategory =
  | "commit_timing"      // e.g. night owl, early bird, weekend-heavy
  | "streak_consistency"  // e.g. daily streaks, long gaps
  | "collaboration"       // e.g. PR/review activity, solo vs team
  | "language_stack"       // e.g. language diversity, primary language
  | "repo_scale"          // e.g. repo count, stars, followers
  | "commit_style";       // e.g. commit size, message length/style

interface Move {
  id: string;              // unique slug, e.g. "midnight_push"
  name: string;            // display name, e.g. "Midnight Push"
  type: string;            // Pokemon-style type, e.g. "Dark", "Electric" — should align with card's typing system
  power: number;           // attack stat, e.g. 65
  category: SignalCategory;
  signal: string;          // underlying signal id this move belongs to, e.g. "commit_hour_distribution"
  tier: number;            // 1 = mildest, higher = more extreme; used to rank within a signal
  threshold: {
    metric: string;        // the field name being checked, e.g. "pctCommitsAfterMidnight"
    min?: number;
    max?: number;
  };
  description: string;     // one-line flavor text shown on the card
}

export const MOVE_BANK: Move[] = [
  // ~50 entries here, grouped/commented by category
];
```

Notes for the coding agent:
- Group entries in the file by `category` with comments for readability.
- Each `signal` should have 2-3 tiers (e.g. `commit_hour_distribution` → tier 1 "Night Commit", tier 2 "Midnight Push", tier 3 "3AM Refactor"), each with its own threshold.
- Thresholds should be non-overlapping and ordered so exactly one tier matches per signal at a given metric value.

## 2. Signal Computation

Before running the decision tree, compute a flat `SignalValues` object from the user's raw GitHub data (this may already partially exist from the stats/typing/ability calculations — reuse where possible):

```ts
interface SignalValues {
  pctCommitsAfterMidnight: number;
  pctCommitsWeekend: number;
  longestStreakDays: number;
  currentStreakDays: number;
  totalReviews: number;
  totalPRs: number;
  languageCount: number;
  primaryLanguagePct: number;
  repoCount: number;
  starCount: number;
  avgCommitMessageLength: number;
  // ... extend as needed for all signals used in the bank
}
```

## 3. Decision Tree — Selection Algorithm

```
function selectMoves(signals: SignalValues): [Move, Move] {
  1. For each Move in MOVE_BANK, check if signals[move.threshold.metric] falls within
     [move.threshold.min, move.threshold.max]. Collect all matching moves.

  2. Within each signal (group matches by `signal` field), keep only the highest
     tier match — a user should only ever match one tier per signal at a time,
     but this guards against overlapping thresholds.

  3. Rank the remaining matched moves by "strength" — how far the metric value
     is past the tier's threshold (normalized), so the most distinctive/extreme
     matches surface first.

  4. Pick the #1 ranked move → this is move slot 1.

  5. Filter out all moves sharing move slot 1's `category`, then pick the top
     ranked move from what remains → this is move slot 2.

  6. Fallback: if fewer than 2 categories have any match (sparse GitHub data),
     fall back to the next-highest ranked match regardless of category, or to
     a designated "default/common" move per category reserved for low-signal
     users (avoids empty move slots).
}
```

Enforce: 2 moves, always from 2 different `category` values, ranked by strength within each.

## 4. Caching — Recompute vs Cache

**Recommendation: compute once and cache alongside the rest of the card data (stats, typing, ability) — do not recompute on every page view.**

Reasoning:
- The decision tree is a pure function over already-fetched GitHub data, so it's cheap either way, but the card's *entire* identity (stats, type, ability, moves) should be computed together and cached as one unit for consistency — you don't want moves recalculating independently and drifting out of sync with the rest of the card on a different refresh cycle.
- Cache invalidation should piggyback on whatever mechanism already refreshes stats/typing (e.g. re-fetch GitHub data on a TTL, or on-demand refresh button) — moves get recalculated as part of that same regeneration, not on a separate schedule.
- If there's currently no caching layer yet for card data at all, this is a good forcing function to add one (e.g. cache computed card JSON per username with a TTL of ~24h, or invalidate on manual refresh).

## 5. Open Items for the Coding Agent
- Populate `MOVE_BANK` with the actual 50 entries (name, type, power, description) per category — can be drafted separately and reviewed before merging.
- Confirm exact `SignalValues` fields against what's already available from existing stat-computation code; avoid duplicating GitHub API calls.
- Wire `selectMoves()` into the existing card-generation pipeline, storing its output alongside stats/ability/typing in the cached card object.
