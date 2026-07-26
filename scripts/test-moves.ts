/**
 * Offline checks for the move bank + decision tree.
 *
 *   npx tsx scripts/test-moves.ts
 */

import {
  DEFAULT_MOVES,
  MOVE_BANK,
  resolveMoves,
  selectMoves,
  type SignalValues,
} from "../lib/moves";

function emptySignals(overrides: Partial<SignalValues> = {}): SignalValues {
  return {
    pctCommitsAfterMidnight: 0,
    pctCommitsEarlyMorning: 0,
    pctCommitsEvening: 0,
    pctCommitsWeekend: 0,
    longestStreakDays: 0,
    currentStreakDays: 0,
    longestGapDays: 0,
    dailyVariance: 0,
    activeDays: 0,
    totalReviews: 0,
    totalPRs: 0,
    reviewsPerCommit: 0,
    collabRatio: 0,
    languageCount: 0,
    primaryLanguagePct: 0,
    languageConcentration: 1,
    repoCount: 0,
    starCount: 0,
    starConcentration: 0,
    starsPerRepo: 0,
    followerCount: 0,
    avgCommitMessageLength: 0,
    maxDailyContributions: 0,
    meanDailyContributions: 0,
    totalCommits: 0,
    ...overrides,
  };
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

console.log(`MOVE_BANK size: ${MOVE_BANK.length}`);
console.log(`DEFAULT categories: ${Object.keys(DEFAULT_MOVES).length}`);

const bySignal = new Map<string, typeof MOVE_BANK>();
for (const move of MOVE_BANK) {
  const list = bySignal.get(move.signal) ?? [];
  list.push(move);
  bySignal.set(move.signal, list);
}

let overlaps = 0;
for (const [signal, moves] of bySignal) {
  for (let i = 0; i < moves.length; i++) {
    for (let j = i + 1; j < moves.length; j++) {
      const a = moves[i].threshold;
      const b = moves[j].threshold;
      const aMin = a.min ?? Number.NEGATIVE_INFINITY;
      const aMax = a.max ?? Number.POSITIVE_INFINITY;
      const bMin = b.min ?? Number.NEGATIVE_INFINITY;
      const bMax = b.max ?? Number.POSITIVE_INFINITY;
      if (Math.max(aMin, bMin) < Math.min(aMax, bMax)) {
        overlaps += 1;
        console.error(
          `OVERLAP ${signal}: ${moves[i].id} vs ${moves[j].id}`,
          a,
          b,
        );
      }
    }
  }
}
assert(overlaps === 0, `expected 0 overlapping tiers, found ${overlaps}`);

const ids = new Set(MOVE_BANK.map((m) => m.id));
assert(ids.size === MOVE_BANK.length, "duplicate move ids");

const sparse = selectMoves(emptySignals());
assert(sparse.length === 2, "sparse must return 2 moves");
assert(
  sparse[0].category !== sparse[1].category,
  "sparse defaults must differ in category",
);
console.log(
  "sparse:",
  sparse.map((m) => `${m.name}/${m.category}`).join(", "),
);

const rich = selectMoves(
  emptySignals({
    pctCommitsAfterMidnight: 0.62,
    longestStreakDays: 120,
    totalReviews: 200,
    languageCount: 7,
    starCount: 5000,
    avgCommitMessageLength: 90,
    totalCommits: 3000,
    followerCount: 2500,
    repoCount: 60,
  }),
);
assert(rich[0].category !== rich[1].category, "rich categories must differ");
assert(rich.every((m) => m.tier >= 1), "rich should not need defaults");
console.log(
  "rich:",
  rich.map((m) => `${m.name} (${m.category} t${m.tier})`).join(", "),
);

// Mid-band night owl should pick Midnight Push, not 3AM.
const midnight = selectMoves(
  emptySignals({ pctCommitsAfterMidnight: 0.35, totalCommits: 200 }),
);
assert(
  midnight.some((m) => m.id === "midnight_push"),
  `expected midnight_push, got ${midnight.map((m) => m.id).join(",")}`,
);
console.log(
  "midnight band:",
  midnight.map((m) => m.id).join(", "),
);

// Cached ids must hydrate to live bank copy (name/description edits apply).
const hydrated = resolveMoves(["proper_subject", "one_liner"]);
assert(hydrated[0].id === "proper_subject", "resolveMoves preserves id");
assert(
  hydrated[0].name === MOVE_BANK.find((m) => m.id === "proper_subject")!.name,
  "resolveMoves pulls live name from bank",
);
assert(
  hydrated[0].description ===
    MOVE_BANK.find((m) => m.id === "proper_subject")!.description,
  "resolveMoves pulls live description from bank",
);
const unknown = resolveMoves(["not_a_real_move", "also_fake"]);
assert(
  unknown.every((m) => m.id === DEFAULT_MOVES.commit_style.id),
  "unknown ids fall back to default commit_style",
);
console.log(
  "hydrate:",
  hydrated.map((m) => `${m.id}→${m.name}`).join(", "),
);

console.log("\nOK — move bank + decision tree checks passed");
