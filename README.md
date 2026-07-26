# PokeGit

Turn any public GitHub profile into a Pokedex entry and a Pokemon-style
trading card. Built to the spec in [`plan.md`](./plan.md).

Two deliverables per username:

1. **Pokedex entry page** (`/[username]`) — six base stats plus BST, dual
   typing, one of 25 abilities, and an LLM-written flavor entry.
2. **Card** (`components/PokeCard.tsx`) — v1 is aesthetics-first: name, single
   type, HP, a language-derived palette, avatar with upload override, and two
   structurally-real placeholder moves.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in the two keys
npm run dev
```

Open http://localhost:3000.

### Environment

| Variable | Required | Purpose |
|---|---|---|
| `GITHUB_TOKEN` | yes | Server-side GitHub API calls. Only needs public read scope. |
| `ANTHROPIC_API_KEY` | no | Generates the Pokedex flavor text. Without it the app falls back to a deterministic entry built from the same signals, marked "offline text" in the UI. |
| `ANTHROPIC_MODEL` | no | Defaults to `claude-sonnet-4-5`. |

There is no user OAuth. Lookups are anonymous and every GitHub call runs
server-side against a single app-owned token.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server. |
| `npm run build` | Production build. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm run lint` | ESLint. |
| `npm run inspect -- <user> [user...]` | Prints the full computed profile for real usernames — the harness for retuning stat curves and ability thresholds. |
| `node scripts/shot.mjs <path> <out.png> [w] [h] [selector]` | Screenshots a running dev server, for card iteration. |

`/design-lab` is an unlinked dev route that renders the card across a spread of
languages, so palette changes can be checked against greys, neons and dark
colors in one pass.

## Architecture

```
lib/github.ts            GraphQL (contribution calendar, year aggregates)
                         + REST (repos, languages, commit timestamps)
lib/stats.ts             derived signals, log-curve stat normalization, typing
lib/abilities.ts         25-ability decision tree, first match wins
lib/ability-thresholds.ts  every numeric cutoff, in one place
lib/language-types.ts    language -> linguist color + Pokemon type
lib/card-palette.ts      linguist color -> usable card palette
lib/flavor-text.ts       Claude call + deterministic fallback
lib/profile.ts           assembles all of the above
```

Colors are never invented. `design-reference/language-colors.json` is a dump of
GitHub's linguist `languages.yml` and is the only source of hex values.

## Tuning knobs

Both of these are expected to move once real distributions are visible
(`plan.md` section 11):

- **Stat curves** — `STAT_CURVES` in `lib/stats.ts`. Each stat has a `ceiling`
  (raw value that saturates the stat) and a `gamma` (curve shaping). They were
  solved against three reference profiles: a heavy OSS maintainer at ~200-230,
  a casual contributor at ~60-100, and a near-inactive account at ~20-40.
- **Ability thresholds** — `lib/ability-thresholds.ts`. Ability *order* is
  load-bearing and lives in `lib/abilities.ts`; earlier entries shadow later
  ones by design.

## Not in v1

Deferred to v2, with layout slots already reserved on the card: real moves
derived from insights, weakness, resistance, retreat cost, stage/evolution
line, rarity symbol, card number. Satori-based PNG export for sharing is the
other v2 item — the card is a self-contained component to keep that seam clean.
