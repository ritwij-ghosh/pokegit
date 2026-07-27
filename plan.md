# PokeGit — Implementation Plan (v1 MVP)

Turn any public GitHub profile into a Pokédex entry + Pokémon-style trading card.
Inspiration: gitfut.com (FIFA-card-for-GitHub). PokeGit does the same job with
Pokémon's data model instead: base stats, type, ability, Pokédex flavor text,
and a card visual.

Two deliverables per username:
1. **Pokédex Entry page** — comprehensive stats, dual-type, ability, AI flavor text.
2. **Card visual** — v1 is aesthetics-first: name, single type, HP, color, 2
   placeholder moves. Content-complete card is a v2 follow-up.

---

## 1. Tech Stack

- **Framework**: Next.js (App Router) on Vercel.
- **Data fetching**: GitHub GraphQL API (contribution calendar, full-year
  aggregate counts) + GitHub REST API (repo list, languages, stars, followers).
  No user OAuth — anonymous lookup by username only, same UX as GitFut. All
  GitHub calls are server-side using a single app-owned PAT (never exposed to
  client). Skip the `/events` feed entirely (too shallow, 90-day/300-event cap).
- **LLM calls**: Server-side call (Claude API) to generate the 2-3 sentence
  Pokédex flavor entry only. Ability selection is NOT an LLM call — it's a
  deterministic rules engine (see Section 4).
- **Card rendering v1**: HTML/CSS/SVG React component (in-app, interactive-ready).
- **Card export (v2, not in this MVP but leave the seam)**: `@vercel/satori` +
  `resvg` via a Next.js `opengraph-image` route, to produce a static shareable
  PNG, matching what GitFut almost certainly does for its own OG images.
- **Hosting**: Vercel. No database required for v1 — compute everything
  on-demand per request; add caching (e.g. Vercel KV or simple in-memory/edge
  cache keyed by username, TTL ~1hr) only if rate limits become an issue.

---

## 2. Data Pipeline

### Inputs fetched per username
GraphQL (`contributionsCollection` over past 12 months):
- Total contributions (past year)
- Contribution calendar (daily counts, for streaks + time-clustering caveat:
  GraphQL calendar is daily-granularity only; for actual time-of-day commit
  clustering, pull recent commit timestamps via REST `/repos/{owner}/{repo}/commits`
  across the user's top N repos as a supplementary signal — document this as
  a best-effort approximation, not full historical accuracy)
- Longest streak / current streak (derived from calendar)
- Total PRs opened + merged
- Total code reviews given
- Total issues opened/closed + rough turnaround time

REST:
- Repo list: languages (bytes per language, aggregated across all repos),
  stars per repo, fork count, topics
- Follower count
- Account creation date (→ account age)
- Avatar URL (→ pfp, with user-upload override option in the UI)

### Derived signals
- **Top language / 2nd language** (by aggregate bytes across repos)
- **Language distribution shape** (even vs. dominant — feeds Polyglot/Specialist)
- **Commit time-of-day histogram** (best-effort, from supplementary REST sample)
- **Commit day-of-week histogram**
- **Streak stats**: longest streak, current streak, gap analysis (dormancy +
  revival detection)
- **Variance of daily contribution counts** (burstiness)
- **Top repo stars vs. aggregate stars** (single-hit vs. broad-appeal ratio)
- **Reviews-to-commits ratio, issues-to-commits ratio** (collaboration signal)

---

## 3. Base Stats (Pokédex Entry — comprehensive)

Six stats, each normalized to a 1-255 scale via **log scale**:
`stat = min(255, k * log(raw + 1))`, with `k` tuned per stat so:
- a very active OSS maintainer lands ~200-230
- a casual student contributor lands ~60-100
- a near-inactive public profile lands ~20-40

| Stat | Raw signal |
|---|---|
| **HP** | Total contributions, past year |
| **Attack** | Total commit count |
| **Sp. Attack** | Stars earned (aggregate) + top single-repo star reach |
| **Defense** | Code reviews given |
| **Sp. Defense** | Follower count |
| **Speed** | Issue open/close turnaround + issue volume |

**Base Stat Total (BST)** = sum of all six. Display alongside the six stats
(this is the implicit "overall rating" replacing GitFut's single 0-99 number).

Tune the `k` constants by hand against a handful of known reference profiles
before shipping (e.g. spot-check against a very high-output maintainer, a
mid-tier student dev, and a near-empty account) so the curve feels right
across the whole range, not just at the extremes.

---

## 4. Typing

- **Pokédex entry**: dual-type. Primary = top language by bytes. Secondary =
  2nd language by bytes. If a user has only one meaningfully-used language
  (e.g. #2 is <5% of total bytes), show single-type instead of forcing a
  meaningless secondary.
- **Card v1**: single-type only = top language by bytes.
- **Language → type mapping**: build a fixed lookup table (e.g. Python →
  Grass, Rust → Fire, JS/TS → Electric, Go → Water, C/C++ → Steel, Ruby →
  Fire/Fairy blend, etc.) — keep this in its own config file
  (`lib/language-types.ts`) since it'll need tuning/expansion as new
  languages come up. Use GitHub's own `linguist` language-color list
  (https://github.com/github-linguist/linguist/blob/main/lib/linguist/languages.yml)
  as the canonical language name + color reference — reuse those same hex
  colors for card backgrounds so it feels "correct" to developers.

---

## 5. Ability — Fixed List, Rules-Based Decision Tree

25 abilities, MECE, evaluated **top-down, first match wins**. Order is
**rarity-first**: scarce reach/outlier signals shadow common rhythm and tenure
labels. Every profile resolves to exactly one ability (the last two entries
are the safety net). Implement as an ordered array of
`{name, test(stats) => bool, description}` and iterate until one test passes.

| # | Ability | Trigger condition |
|---|---|---|
| 1 | Viral Hit | Top single repo's stars ≫ rest of profile combined |
| 2 | Crowd Favorite | Aggregate stars top percentile, no single dominant repo |
| 3 | Influencer | Followers high relative to own contribution volume |
| 4 | Rising Star | Account age <1 year AND top-percentile contributions/stars |
| 5 | Comeback Kid | 90+ day dormant gap, then renewed activity in last 90 days |
| 6 | Streak Master | Longest streak ≥100 consecutive days |
| 7 | Prolific | Total contributions top percentile, not otherwise caught |
| 8 | Community Pillar | Code reviews given, top percentile |
| 9 | Mentor | High reviews AND high followers together |
| 10 | First Responder | Fast average issue close/response turnaround |
| 11 | Bug Hunter | High issue open/close volume, turnaround not notably fast |
| 12 | Perfectionist | Few repos, high stars-per-repo ratio |
| 13 | Architect | High repo count |
| 14 | Burst Mode | High variance in daily contribution counts (spiky, no long dormancy) |
| 15 | Steady Grinder | Low variance, no gaps >7 days, moderate-high volume |
| 16 | Weekend Warrior | >40% commits on Sat/Sun |
| 17 | Night Owl | >40% commits between 12am-5am |
| 18 | Early Bird | >40% commits between 5am-9am |
| 19 | Polyglot | 5+ languages, meaningfully even distribution |
| 20 | Specialist | One language >90% of activity |
| 21 | Solo Artist | High solo output, low collaboration signals |
| 22 | Team Player | Collaboration signals high relative to solo commit output |
| 23 | Veteran | Account age ≥5 years |
| 24 | Balanced | No signal reaches top/bottom percentile on any axis above |
| 25 | Newcomer (catch-all) | Doesn't meet any threshold above |

Percentile thresholds need rough reference points — hardcode reasonable
starting cutoffs (document them clearly in one config file,
`lib/ability-thresholds.ts`) and expect to retune after seeing real
distributions from testing.

---

## 6. Pokédex Flavor Text — LLM-Generated

- One server-side LLM call per lookup, using the computed stats/signals as
  structured input (not raw API dump — pre-summarize into a compact JSON of
  the interesting derived signals: top ability, dominant time pattern, streak
  behavior, star reach, etc.).
- **Hard cap: 2-3 sentences.** Style: real Pokédex entry cadence — concise,
  observational, third-person, matter-of-fact, blending a behavioral insight
  with an implied strength/weakness. Reference examples to include in the
  system prompt:
  - "Known to spend late nights debugging Python scripts."
  - "Observed to explosively make commits, then disappear until another
    explosion."
- Explicitly instruct the model: no praise/hype language, no exclamation
  points, stay descriptive not evaluative, ground every sentence in a
  specific real stat rather than generic filler.
- Treat this prompt as a v1 draft to refine iteratively once real output is
  visible — flag it in code with a comment noting it's expected to change.

---

## 7. Card Visual (v1 scope — aesthetics-first)

Content included in v1:
- **Name** = GitHub username
- **Type** = single type (top language)
- **HP** = computed HP stat
- **Card color** = derived from the language's linguist color (map to a
  Pokémon-style card color scheme — e.g. background gradient/banner tinted
  toward the language color, not a literal hex-for-hex swap, since raw
  linguist colors don't always look good as a full card background)
- **2 moves** = placeholder/lorem text for now (structure must be real:
  move name, energy cost pips, damage number, description line — just fill
  with placeholder content so the layout is provable)
- **Image** = GitHub avatar (pfp), with an upload-your-own-image override
  in the UI (simple file input, client-side preview, no server storage
  needed for v1 — render straight from the uploaded File/blob)

Explicitly NOT in v1 (defer to v2): real moves derived from insights,
weakness/resistance, retreat cost, stage/evolution line, rarity symbol,
illustrator credit, card number/set — but leave placeholder slots in the
layout for all of these so the visual composition already accounts for
where they'll go.

### Layout skeleton (must match this structure, polish is the agent's job)
```
┌─────────────────────────────────────┐
│ [Name/username]      HP [value] [Type icon] │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │        [pfp / uploaded img]     │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│ ─────────────────────────────────── │
│ [pip pip]  Move Name 1     [dmg]    │
│   placeholder description line      │
│ ─────────────────────────────────── │
│ [pip pip pip] Move Name 2  [dmg]    │
│   placeholder description line      │
│ ─────────────────────────────────── │
│ Weakness: [ph]  Resist: [ph]  Retreat: [ph]│
│ PokeGit.dev            Illus. PokeGit│
└─────────────────────────────────────┘
```

---

## 8. Design Process — How to Get the Aesthetic Right

**Provide reference assets. Do not let the agent guess layout from text alone.**

Before starting the card-design subagent, populate `/design-reference/` with:
1. **3-5 real Pokémon card photos/scans**, spanning different eras (e.g. one
   Base Set-era card, one modern Scarlet & Violet-era card, one basic Pikachu-style
   common) — captures how conventions have shifted while staying "obviously
   Pokémon."
2. **1-2 GitFut screenshots** (card + entry page) for tonal/layout inspiration
   on the "GitHub stats as game card" framing specifically.
3. **`language-colors.json`** — a pre-built JSON of language → hex color,
   sourced from GitHub's linguist `languages.yml`. Do not let the agent invent
   these; hand them a real reference file.
4. **`layout-skeleton.md`** — the ASCII skeleton from Section 7, so structure
   is locked and only visual polish is left to explore.

Iterate visually: screenshot renders back to the agent and ask for targeted
tweaks, rather than trying to describe the full aesthetic in one giant prompt.

---

## 9. Suggested Subagent Setup (Cursor)

Run these as parallel subagents, each scoped to a clear file/folder boundary
so they don't collide:

1. **`data-agent`** — owns `lib/github.ts`, `lib/stats.ts`,
   `lib/abilities.ts`, `lib/language-types.ts`. Builds the GraphQL/REST
   fetching, stat normalization (log scale), ability decision tree, typing
   logic. Pure data/logic, no UI. Model: strong at logic/algorithms —
   Claude Sonnet is a solid default for this.
2. **`llm-agent`** — owns `lib/flavor-text.ts` and the server route that
   calls the LLM for the Pokédex entry text. Small, isolated scope. Model:
   Claude Sonnet is fine; this is mostly prompt-engineering, not heavy code.
3. **`entry-page-agent`** — owns `app/[username]/page.tsx` (the Pokédex
   entry page) and its components. Consumes `data-agent`'s and
   `llm-agent`'s outputs. Straightforward data-display UI — less aesthetic
   pressure than the card.
4. **`card-design-agent`** — owns `components/PokeCard.tsx` and its styles.
   This is the aesthetic-critical piece — feed it everything from Section 8
   (`/design-reference/` folder) directly as attachments/context up front.
   Model: use your strongest available model for this one specifically
   (whichever your subagent setup treats as top-tier — e.g. Opus-class if
   available) since visual/layout judgment benefits most from the strongest
   reasoning, and plan on multiple screenshot-and-iterate rounds rather than
   expecting one-shot perfection.
5. **`landing-agent`** — owns `app/page.tsx` (username input landing page).
   Small, low-risk, can run with any model.

Give every subagent the same shared root context up front: this `plan.md`,
plus `/design-reference/` for anything touching the card.

---

## 10. Directory Checklist Before Saying "implement plan.md"

```
/plan.md                          (this file)
/design-reference/
  ├── pokemon-card-base-set.jpg
  ├── pokemon-card-modern-sv.jpg
  ├── pokemon-card-common-basic.jpg
  ├── gitfut-card-screenshot.png
  ├── gitfut-entry-screenshot.png
  ├── language-colors.json
  └── layout-skeleton.md
```

Everything else (GitHub PAT, LLM API key) goes in `.env.local` — do not
commit real tokens; add `.env.local` to `.gitignore` before the first commit.

---

## 11. Open Items to Revisit Post-MVP

- Ability + stat-normalization percentile thresholds will need retuning once
  real usage data comes in.
- Real moves (derived from insights) + full card content (weakness,
  resistance, retreat, rarity, stage) — v2.
- Satori-based PNG export for sharing/OG images — v2, immediately after card
  visual is locked.
- Caching layer if GitHub rate limits or LLM cost become a concern at scale.
