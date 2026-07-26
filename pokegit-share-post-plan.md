# PokeGit Share Post — Implementation Plan

## Goal
One-click "Post to LinkedIn / X" that auto-generates a positive hook, keeps the Pokedex printout feel, and is less stat-dense. Deploy fixes localhost issue separately (not in scope here).

## 1. Hook Generator (shared by both platforms)

Add a `generateHook(cardData)` function that picks the **single most flattering data point** and turns it into a one-liner. Priority order (use first match):

1. **Highest stat** among HP/ATK/DEF/SpA/SpD/SPE if it's notably high (e.g. top 25th percentile or above some threshold) → template: `"Apparently my {StatName} stat is elite: {value}."` or type-flavored, e.g. `"My {StatName} stat is basically maxed out."`
2. **Ability name** if it has a fun/positive connotation → `"Just found out my GitHub ability is '{Ability}'."`
3. **Typing** → `"Turns out my code is {Type1}/{Type2}-type."`
4. **Fallback**: streak/volume metric (contributions, commits) → `"{value} contributions later, I got Pokedex'd."`

Implementation:
- Pure function, no LLM call needed — deterministic template selection keeps it fast and free for one-click flow.
- Store 3-5 template variants per case, pick randomly for variety across shares.
- Output: single string, no hashtags/emoji baked in (let platform-specific formatter add flavor).

## 2. Reduce Stat Density (both platforms)

Cut the full 6-stat readout down to a **top-line stat + 2 highlight stats**, not all 6.

- Keep: BST (total), + top 2 individual stats (highest values, most flattering).
- Drop the full HP/ATK/DEF/SpA/SpD/SPE line entirely from share copy (still fine on the actual card page).
- Metrics line: pick 2-3 of {contributions, commits, stars, followers} — whichever are non-zero/most impressive — instead of listing all 4 including zeros (e.g. drop "0 reviews").

## 3. LinkedIn Post Template

```
{auto_hook}

Ran my GitHub through PokeGit — a Pokedex card for your commit history.

@{username} · {Type1}/{Type2}-type
Ability: {Ability}
BST {total} · {top_metric_1} · {top_metric_2}

My card → {deployed_url}/{username}
Try yours → {deployed_url}
```

Notes:
- Fix pluralization (`1 star` not `1 stars`) — add simple `pluralize(count, noun)` helper used everywhere counts are rendered.
- No "Scouting metrics" label — fold into the compact stat line above.

## 4. X (Twitter) Post Template

Shorter, punchier, no "Ran my GitHub through..." explainer line — X audience infers from format.

```
{auto_hook}

@{username} · {Type1}/{Type2}
{Ability} · BST {total} · {top_metric_1}

card → {deployed_url}/{username}
yours → {deployed_url}
```

Notes:
- Cap total length to fit comfortably under X limit incl. links.
- Lowercase/casual tone throughout (matches existing "just got pokedex'd" voice) — don't over-capitalize hook.

## 5. One-Click Flow

- `sharePost(platform, cardData)`:
  1. Call `generateHook(cardData)`
  2. Select top 2 stats + top 2-3 non-zero metrics
  3. Fill platform template
  4. Open platform share intent URL (`https://twitter.com/intent/tweet?text=...` / LinkedIn share URL) pre-filled — user still gets final edit control before posting, but no manual copy/paste step.
- No LLM call in the critical path — keep it instant.

## 6. Out of Scope (tracked separately)
- Swapping `localhost:3000` → deployed Vercel domain once live.
- Any stat rebalancing/normalization on the underlying card generation itself.
