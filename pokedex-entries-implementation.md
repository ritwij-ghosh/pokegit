# Pokédex Entries — Generate-Once, Cache-Forever Implementation

## Goal
Each repo gets a unique, AI-generated Pokédex-style flavor blurb, generated **once** and stored permanently. No live generation on page load, no user-triggered regeneration. Cost stays near $0 regardless of traffic.

## Model/API Choice
Use **Groq's free-tier API** (https://console.groq.com) running an open model like Llama 3.3 70B or Llama 3.1 8B. Groq is the right fit here because: it's free at low/moderate volume, extremely fast inference (sub-second), requires no GPU hosting or infra of your own, and is OpenAI-SDK-compatible so integration is just a base URL + API key swap if you're already using an OpenAI-style client. Sign up for a free Groq API key and store it as an environment variable (`GROQ_API_KEY`) in Vercel's project settings — never hardcode it.

## Data Model
Add two columns to the repo table/record:
- `pokedex_entry` (text, nullable) — the generated blurb.
- `pokedex_entry_generated_at` (timestamp, nullable) — for debugging/auditing, not for triggering regeneration.

## Trigger Point — Generate exactly once, at creation
Generation should fire **only** at the moment a repo is first created/imported into pokegit (i.e., whatever server action/API route currently handles "new repo added" or "repo synced for the first time"). This is the only trigger — no metadata-drift refresh, no cron, no manual button, per your call.

Implementation shape:
1. In the repo-creation code path (wherever the repo record is first inserted into the DB), after the insert succeeds, kick off a call to generate the Pokédex entry.
2. This should be a **fire-and-forget background call**, not something the user waits on — don't block the repo-creation response/UI on the LLM call. Options depending on your stack:
   - If using Next.js Route Handlers/Server Actions: call the generation function without `await`-blocking the response (or use `after()` from `next/server` if on a Next.js version that supports it, which runs code after the response is sent).
   - Alternatively, insert the repo with `pokedex_entry = NULL` immediately, and have a lightweight serverless function (a Vercel API route) triggered right after (e.g. via a simple internal fetch call, or a queue if you already have one) that does the generation and then updates the row.
3. Until `pokedex_entry` is populated, the UI should show a graceful placeholder (e.g. "Pokédex data pending..." or similar in-theme copy) rather than blank/broken state. This should resolve within a second or two given Groq's speed, but shouldn't be a blocking spinner on repo creation itself.

## Prompt Construction
Build the prompt from real repo metadata you already have available:
- Repo name
- Primary language (and the type-color mapping you already built, e.g. "Fire-type" for Rust)
- Existing repo description (if any)
- Star count
- Age (created date) or first-commit date
- Commit frequency/count if easily available

Example prompt shape (adjust wording to taste, keep it short since this is a small blurb, not long-form content):

```
You are writing a short, fun "Pokédex entry" style description for a GitHub-style repository, in the tone of a Pokémon Pokédex (playful, matter-of-fact, slightly mysterious). 

Repo name: {name}
Primary language: {language} ({type_label}-type)
Description: {description or "none provided"}
Stars: {stars}
First seen: {created_date}

Write ONE short paragraph (2-3 sentences max, under 60 words) in the style of a Pokédex entry describing this repository as if it were a creature in the wild. Do not reference real Pokémon names or copyrighted characters. Keep it purely inspired by the tone/format, not the IP. Return only the entry text, no preamble.
```

## API Call Implementation Notes
- Use Groq's chat completions endpoint (OpenAI-compatible: `POST https://api.groq.com/openai/v1/chat/completions`) with a model like `llama-3.3-70b-versatile` or `llama-3.1-8b-instant` (8B is cheaper/faster if quality is sufficient for short blurbs — worth testing both).
- Set a low `max_tokens` (e.g. 100-150) since output should be short.
- Set `temperature` moderately high (e.g. 0.8-1.0) for variety between repos, since these should feel unique rather than templated.
- Wrap the call in a try/catch. **On failure (rate limit, API error, timeout), do NOT retry indefinitely or block anything** — just leave `pokedex_entry` as NULL and show the in-theme placeholder copy. Optionally log the failure for later manual/batch backfill, but don't build automatic retry logic that could cascade into repeated calls.
- No need for streaming — this is a single short blurb, request the full completion at once.

## Cost & Rate Limit Behavior
Since generation only fires once per repo at creation time, total API usage scales with "number of repos ever created," not with traffic/views — this keeps the app well within Groq's free tier for any realistic usage pattern. If you anticipate high repo-creation volume (e.g. bulk imports), consider a simple in-memory or DB-based queue with a small delay between calls to stay under Groq's requests-per-minute free-tier cap, rather than firing all calls simultaneously.

## What NOT to build
- No "reroll"/regenerate button.
- No live generation on page view/load.
- No cron-based periodic refresh.
- No blocking the repo-creation UX on the LLM response.
