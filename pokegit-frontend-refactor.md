# pokegit Frontend Refactor — Pokémon (GBA Gen 3) Theme

## Objective
Perform a full frontend/visual refactor of pokegit (currently styled similarly to gitfut.com) to give it a distinctly Pokémon-inspired look and feel, modeled on the GBA Gen 3 era (Ruby/Sapphire/Emerald) aesthetic. This is a **visual/vibe refactor only** — no changes to functionality, data models, routing, or IA. Do it in one full pass across the entire app.

**Stack:** React + Next.js, Tailwind CSS v4 (utility classes in components), with theme variables and custom CSS (lattice background, animations) currently living in `globals.css`. Standardize new theme tokens using Tailwind v4's `@theme` directive so they're available as utility classes everywhere.

---

## Design Pillars

1. **Distinctly GBA, but modern.** Reference GBA Gen 3 UI conventions (thick borders, high-contrast panels, chunky pixel accents) without being a literal one-to-one recreation of a Game Boy Advance screen. Modern touches (slightly softened shadows, sensible border-radius where needed, responsive layout) are welcome as long as the DNA reads as "GBA Pokémon" at a glance.
2. **Theme depth: middle ground.** Visual chrome, flavor text, loading states, and empty states should go full Pokémon (e.g., loading spinner is a Poké Ball, empty state copy says something like "A wild 404 appeared!"). However, **do not rename or hide standard git nouns** — repos are still "repos," commits are still "commits," branches are still "branches," PRs are still "PRs." The theme is skin + flavor, not a puzzle over functional labels.
3. **No copyrighted IP.** Do NOT reproduce actual Pokémon characters, official sprites, the official Poké Ball logo/wordmark, or any Nintendo/Game Freak trademarked assets. All decorative elements must be original, generic, "inspired by" imagery — e.g., a generic ball-shaped icon (not the exact official Poké Ball design), generic potion bottles, generic badge shapes, generic map-pin icons. Treat this as a hard constraint, not a suggestion.
4. **Object-only theming, no mascot.** Do not introduce any custom pixel-art creature/mascot. All decorative elements are objects (balls, potions, badges, map pins, packages/crates, etc.), not characters.

---

## Specific Requirements

### 1. Color Palette & Theme Toggle
- Implement **two themes**: an "Authentic" (light) mode using a Pokédex-inspired palette (warm cream backgrounds, forest green accents, saturated red/blue/yellow accent pops) and a "Dark" mode (deep navy/charcoal base with the same saturated red/blue/yellow accents popping against it).
- Build a theme toggle (button/switch) in the nav/header that swaps between the two. Persist the user's choice (e.g., localStorage or existing app state, whichever pattern the app already uses for preferences).
- Define both palettes as Tailwind v4 `@theme` tokens (e.g., `--color-pokedex-red`, `--color-route-green`, `--color-panel-cream`, `--color-night-navy`, etc.) so components reference semantic tokens, not raw hex values.

### 2. Typography — Hybrid Pixel Fonts
- **Display/header font:** an authentic-style pixel font (Pokémon-menu-inspired, e.g. something in the family of "Press Start 2P" or a similar GBA-menu-style pixel font) used for: the logo/wordmark, page headers, nav labels, primary button text, and section titles.
- **Body/data font:** a cleaner, more legible pixel-style monospace (e.g. "Pixel Operator" or "Silkscreen" or similar) used for: commit messages, file names, diffs, repo descriptions, timestamps, and any dense/long-form text where the chunky display font would hurt readability.
- Load both via `next/font` or self-hosted font files; ensure fallback stacks are sensible monospace/system fonts.

### 3. Logo / Wordmark
- Redesign the "pokegit" logo as a **full pixel wordmark** using the display pixel font, styled like a GBA title screen treatment (could include a subtle drop shadow, a small decorative accent near the text — e.g. a small generic pixel badge/dot — but no copyrighted Poké Ball design).

### 4. UI Component Language ("softened homage, in-between")
- Apply a **GBA-panel-inspired treatment** to: navigation bar, primary/secondary buttons, modals, empty states, and loading states. This means: thicker borders (2-4px), high-contrast border colors, a slight offset/hard drop-shadow (not a soft blurred modern shadow), and minimal-to-no border-radius on these elements to evoke the dialogue-box/menu-box feel.
- Data-dense areas (repo list items, commit history rows, diff views, file trees) should get **lighter-touch theming**: updated color palette, updated fonts, subtle border/accent treatment, but should NOT get the full thick-border box treatment — preserve scannability and information density.
- This is a spectrum, not two hard buckets — use judgment to keep the whole app feeling cohesive rather than like two different UIs stitched together.

### 5. Backgrounds — Zone-Based Tile Texture
- Do NOT apply a tile/texture background globally.
- Add a **subtle, low-opacity repeating tile texture** (evoking GBA overworld tiles — grass/route-style pattern, generic and non-IP) only in specific zones: the header/hero area of the dashboard, and empty-state panels (e.g. "no repos yet," "no commits found").
- Keep all other backgrounds (repo lists, commit views, diffs, settings) as clean solid theme-colored backgrounds — no texture — to protect readability.

### 6. Language → "Type" Color Badges
- Wherever the app currently shows a language indicator (e.g. a colored dot next to "JavaScript," "Python," etc. on repo cards), replace/extend it with a **Pokémon-type-inspired color+icon badge**:
  - Suggested mapping (adjust as needed for full language coverage): JavaScript/TypeScript → Electric (yellow), Python → Grass (green), Rust/C/C++ → Fire (orange/red), Go → Water (blue), Ruby → Fire/Poison (red/purple), Java/Kotlin → Fighting or Ground (brown), HTML/CSS → Fairy or Normal, Shell → Rock/Ground, other/unknown → Normal (gray).
  - The language name should still be shown as text; the type-color badge is an additive visual accent (small colored icon/chip), not a replacement for the label.

### 7. Sound Effects (subtle, opt-in default off)
- Add lightweight SFX for key interactions only: a soft "blip" on navigation/button clicks, and a short "success chime" on completed actions like a successful push, merge, or save (evoking a "level up"/menu-select sound without being a literal copyrighted jingle).
- **Default OFF.** Add a clearly visible, easy-to-find toggle (e.g. a speaker icon in the nav or in settings) to enable/disable sound. Respect the user's choice persistently.
- Keep SFX files short (<1s), original or royalty-free (no ripped game audio), and low-volume by default.

### 8. Flavor Text (middle-ground theming)
- Update copy in loading states, empty states, and error states to have a light Pokémon flavor, while keeping meaning unambiguous. Examples of tone (write original variations, don't reuse verbatim game text):
  - Loading: "Loading your route..." / "Fetching data from the PC..."
  - Empty repo list: "Looks like there's nothing here yet — time to catch your first repo!"
  - 404/error: "A wild error appeared! It's super effective... at breaking things."
- Keep this copy easily findable/editable (e.g. a single constants/copy file) so it can be tuned post-launch without hunting through components.

---

## Explicitly Out of Scope
- No changes to routing, data fetching, auth, or any backend/API behavior.
- No renaming of core git terminology (repos, commits, branches, PRs, etc.).
- No custom mascot/creature illustrations.
- No reproduction of actual Nintendo/Game Freak trademarked characters, sprites, or logos.
- No global tile-texture backgrounds behind dense text/data views.

## Deliverable
A single cohesive pass across the entire app (nav, dashboard/repo list, repo detail, file browser, diffs/commits, settings, auth pages) implementing the above. Prioritize a consistent, reusable Tailwind v4 theme (tokens for both Authentic and Dark modes) over one-off inline styles, so future components inherit the theme automatically.
