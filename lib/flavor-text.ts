/**
 * Pokédex flavor text via Groq (generate-once; see pokedex-entries-implementation.md).
 *
 * Generation is triggered only when a profile is first recorded — never on every
 * page view. This module owns the prompt + API call; persistence lives in
 * lib/pokedex-entries.ts.
 */

import "server-only";

import { withGroqSpacing } from "@/lib/rate-limit";
import type { PokeGitProfile } from "@/lib/types";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.1-8b-instant";

const SYSTEM_PROMPT = `You are writing a short, fun "Pokédex entry" style description for a GitHub developer profile, in the tone of a Pokémon Pokédex (playful, matter-of-fact, slightly mysterious).

Write ONE short paragraph (2-3 sentences max, under 60 words) describing this developer as if they were a creature observed in the wild. Refer to the subject as "this developer", "it", or by behavior — never by username, never as "you".

Hard rules:
- Do not reference real Pokémon names or copyrighted characters. Keep it purely inspired by the tone/format, not the IP.
- No praise or hype language. Not "impressive", "prolific", "incredible", "remarkable", "powerhouse", "legendary".
- No exclamation points.
- Every sentence must be grounded in a specific signal from the data given to you. Do not invent behavior the data does not support.
- Output only the entry text. No preamble, no quotation marks, no markdown.`;

/**
 * Compact digest of the interesting derived signals. This is deliberately
 * small and pre-interpreted — the model should not be doing arithmetic.
 */
export function buildSignalDigest(profile: PokeGitProfile) {
  const s = profile.signals;
  const pct = (n: number) => Math.round(n * 100);

  return {
    type: profile.typing.secondary
      ? `${profile.typing.primary}/${profile.typing.secondary}`
      : profile.typing.primary,
    primaryLanguage: profile.typing.primaryLanguage,
    secondaryLanguage: profile.typing.secondaryLanguage,
    ability: profile.ability.name,
    abilityMeaning: profile.ability.description,

    accountAgeYears: Number(s.accountAgeYears.toFixed(1)),
    contributionsPastYear: profile.raw.totalContributions,
    commitsPastYear: profile.raw.commits,
    codeReviewsGiven: profile.raw.reviews,
    issuesOpened: profile.raw.issuesOpened,
    followers: profile.raw.followers,
    publicRepos: profile.raw.publicRepos,
    totalStars: profile.raw.totalStars,
    topRepoStars: profile.raw.topRepoStars,

    longestStreakDays: s.streaks.longest,
    currentStreakDays: s.streaks.current,
    longestQuietStretchDays: s.streaks.longestGap,
    returnedAfterLongAbsence: s.streaks.hasComeback,
    dailyOutputSpikiness:
      s.dailyVariance > 2.2 ? "very spiky" : s.dailyVariance > 1.2 ? "uneven" : "even",

    commitClock:
      s.timeOfDay.sampleSize === 0
        ? null
        : {
            sampleSize: s.timeOfDay.sampleSize,
            afterMidnightPct: pct(s.timeOfDay.lateNight),
            earlyMorningPct: pct(s.timeOfDay.earlyMorning),
            daytimePct: pct(s.timeOfDay.day),
            eveningPct: pct(s.timeOfDay.evening),
          },
    weekendSharePct: pct(s.weekendShare),

    languageSpread: s.languages.slice(0, 4).map((l) => ({
      language: l.name,
      sharePct: pct(l.share),
    })),
    oneRepoHoldsMostStarsPct: pct(s.starConcentration),
    medianIssueTurnaroundHours:
      s.medianIssueTurnaroundHours === null
        ? null
        : Math.round(s.medianIssueTurnaroundHours),

    baseStats: {
      hp: profile.stats.hp,
      attack: profile.stats.attack,
      defense: profile.stats.defense,
      spAttack: profile.stats.spAttack,
      spDefense: profile.stats.spDefense,
      speed: profile.stats.speed,
      total: profile.stats.total,
    },
  };
}

function buildUserPrompt(profile: PokeGitProfile): string {
  const created = profile.profile.createdAt.slice(0, 10);
  const description = profile.profile.bio?.trim() || "none provided";

  return `Repo/profile name: ${profile.profile.login}
Primary language: ${profile.typing.primaryLanguage} (${profile.typing.primary}-type)
Description: ${description}
Stars: ${profile.raw.totalStars}
First seen: ${created}

Signal digest (ground every sentence in this data):
${JSON.stringify(buildSignalDigest(profile), null, 2)}

Write the Pokédex entry now. Return only the entry text.`;
}

/** Trim to at most three sentences, in case the model overruns the cap. */
function enforceSentenceCap(text: string, max = 3): string {
  const cleaned = text
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .replace(/\s+/g, " ")
    .replace(/!/g, ".");
  const sentences = cleaned.match(/[^.?]+[.?]+/g);
  if (!sentences) return cleaned;
  return sentences.slice(0, max).join(" ").trim();
}

/**
 * Deterministic entry used when no API key is configured.
 * Grounded in the same real signals, just without the model's phrasing.
 */
export function fallbackFlavorText(profile: PokeGitProfile): string {
  const s = profile.signals;
  const lang = profile.typing.primaryLanguage;
  const parts: string[] = [];

  if (profile.raw.totalContributions === 0) {
    parts.push("Leaves almost no public trace of its activity.");
    parts.push(
      "Whatever work it does appears to happen somewhere the record does not reach.",
    );
    return parts.join(" ");
  }

  if (s.timeOfDay.sampleSize >= 25 && s.timeOfDay.lateNight > 0.3) {
    parts.push(`Known to work on ${lang} well past midnight.`);
  } else if (s.streaks.longest >= 100) {
    parts.push(
      `Has been observed contributing for ${s.streaks.longest} consecutive days without a break.`,
    );
  } else if (s.dailyVariance > 2.2) {
    parts.push(
      `Commits to ${lang} in sudden bursts, then goes quiet for stretches at a time.`,
    );
  } else {
    parts.push(
      `Works steadily in ${lang}, logging ${profile.raw.totalContributions.toLocaleString()} contributions over the past year.`,
    );
  }

  if (s.starConcentration > 0.7 && s.topRepoStars > 100) {
    parts.push(
      "Nearly all of the attention it receives is drawn by a single repository.",
    );
  } else if (profile.raw.reviews > profile.raw.commits) {
    parts.push(
      "Spends more effort reading other developers' work than writing its own.",
    );
  } else if (profile.raw.followers > 500) {
    parts.push("Tends to be watched more often than it watches.");
  } else {
    parts.push(
      `Its output concentrates in ${s.meaningfulLanguageCount <= 1 ? "a single language" : `${s.meaningfulLanguageCount} languages`}.`,
    );
  }

  return parts.join(" ");
}

export function isGroqConfigured(): boolean {
  const key = process.env.GROQ_API_KEY;
  return Boolean(key && !key.startsWith("gsk_your_"));
}

/**
 * Call Groq once. On any failure returns null — caller leaves the DB entry NULL
 * and shows the pending placeholder (no retry cascade).
 */
export async function generateFlavorTextWithGroq(
  profile: PokeGitProfile,
): Promise<string | null> {
  if (!isGroqConfigured()) return null;

  try {
    const response = await withGroqSpacing(async () =>
      fetch(GROQ_ENDPOINT, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        cache: "no-store",
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || DEFAULT_MODEL,
          max_tokens: 150,
          temperature: 0.9,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: buildUserPrompt(profile) },
          ],
        }),
      }),
    );

    if (!response.ok) {
      console.error(
        `[flavor-text] Groq responded ${response.status}; leaving entry unset.`,
      );
      return null;
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = payload.choices?.[0]?.message?.content?.trim();
    if (!raw) return null;
    return enforceSentenceCap(raw);
  } catch (error) {
    console.error("[flavor-text] Groq call failed; leaving entry unset.", error);
    return null;
  }
}
