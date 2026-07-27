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
| `GROQ_API_KEY` | no | Generates the Pokédex flavor text **once** per username via Groq. Without it a deterministic offline entry is cached instead. |
| `GROQ_MODEL` | no | Defaults to `llama-3.1-8b-instant`. |
| `SUPABASE_URL` | yes* | Permanent generate-once cache for Pokédex entries. |
| `SUPABASE_ANON_KEY` | yes* | Works with fill-once RLS for local/dev writes. |
| `SUPABASE_SERVICE_ROLE_KEY` | recommended | Preferred for production server-side writes. |

\*Without Supabase the app still renders, but entries are offline-only and not persisted.

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
| `npm run test:pokedex -- [user]` | Smoke-tests generate-once caching for a username (default `octocat`). |
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
lib/theme-accent.ts      linguist color -> contrast-solved per-theme accent
lib/flavor-text.ts       Groq call + deterministic fallback
lib/pokedex-entries.ts   Supabase generate-once cache
lib/pokedex-generation.ts  fire-and-forget generation via after()
lib/rate-limit.ts        in-process generation / poll rate limits
lib/supabase.ts          server Supabase client
lib/profile.ts           assembles all of the above (1h GitHub cache)
lib/copy.ts              every themed string in the UI
lib/prefs.ts             theme + sound persistence (localStorage)
lib/sfx.ts               synthesized WebAudio blip and chime
```

Pokédex flavor text is generated **once** when a username is first seen, stored
in Supabase forever, and never regenerated on page views. Until the write lands,
the UI shows “Pokédex data pending…” and polls a read-only API route.


Colors are never invented. `design-reference/language-colors.json` is a dump of
GitHub's linguist `languages.yml` and is the only source of hex values.

## Theme

The UI is a GBA-era handheld pastiche. Two palettes ship, both defined as
Tailwind v4 `@theme` tokens in `app/globals.css`:

- **Authentic** — warm cream panels, forest-green accent.
- **Dark** — deep navy panels, the same saturated red/blue/yellow pops.

The choice persists in `localStorage` and is applied before first paint by an
inline script in `app/layout.tsx`, so reloads never flash the other palette.
Without a stored choice the OS `prefers-color-scheme` wins.

Two conventions keep the app from feeling like two UIs stitched together:

| Class | Used for | Treatment |
|---|---|---|
| `.gba-panel` / `.gba-btn` / `.gba-field` | chrome: nav, buttons, dialogue boxes, empty and loading states | 3px ink border, hard offset shadow, square corners |
| `.dex-panel` | data: stat rows, metrics, language lists | 2px subtle border, no shadow — density over drama |

Tile texture (`.tile-route`) is scoped to the landing hero and the profile
hero only. It never sits behind dense text.

A profile's identity color comes from its top language, and linguist hexes are
picked to read as 10px dots on github.com — not as text on cream or navy.
`lib/theme-accent.ts` re-solves lightness per theme until the color clears
4.5:1 against the worst-case background for that palette, preserving hue so
JavaScript still reads yellow and Ruby still reads red.

### Fonts

Both pixel faces are Google Fonts under the SIL Open Font License, loaded via
`next/font/google`:

- **Press Start 2P** (`font-display`) — wordmark, headings, nav and button
  labels. Sized small everywhere; it is unusable at body sizes.
- **Silkscreen** (`font-sans` / `font-mono`) — body, metrics, flavor text.

Cabin stays scoped to the card, which is a trading-card pastiche rather than
app chrome.

### Sound

Off by default, toggled from the speaker button in the header, persisted in
`localStorage`. Both effects are synthesized from oscillators in `lib/sfx.ts` —
no audio files, no sampled game audio. A single delegated click listener in
`components/SoundToggle.tsx` handles the blip for every button and link.

### Original artwork only

No Nintendo or Game Freak assets are reproduced. Decorative marks are objects,
not characters: `components/DexBall.tsx` is an original capture-ball motif with
a diamond latch and a theme-colored top half, deliberately distinct from the
Poke Ball design. The 18 type glyphs in `components/TypeSymbol.tsx` are drawn
from scratch on a 24x24 grid.

## Tuning knobs

Both of these are expected to move once real distributions are visible
(`plan.md` section 11):

- **Stat curves** — `STAT_CURVES` in `lib/stats.ts`. Each stat has a `ceiling`
  (raw value that saturates the stat) and a `gamma` (curve shaping). They were
  solved against three reference profiles: a heavy OSS maintainer at ~200-230,
  a casual contributor at ~60-100, and a near-inactive account at ~20-40.
- **Ability thresholds** — `lib/ability-thresholds.ts`. Ability *order* is
  load-bearing and lives in `lib/abilities.ts` (rarity-first ladder); earlier
  entries shadow later ones by design.

## Not in v1

Deferred to v2, with layout slots already reserved on the card: real moves
derived from insights, weakness, resistance, retreat cost, stage/evolution
line, rarity symbol, card number. Satori-based PNG export for sharing is the
other v2 item — the card is a self-contained component to keep that seam clean.
