/**
 * Pokedex flavor text generation (plan.md section 6). Server-side only.
 *
 * One Claude call per lookup. The model receives a pre-summarized digest of
 * derived signals, never a raw API dump, so every sentence it writes can be
 * traced back to a real computed number.
 *
 * PROMPT IS A V1 DRAFT. plan.md section 6 explicitly expects this to be
 * refined once real output is visible across a range of profiles. Treat the
 * system prompt below as the thing most likely to change.
 */

import "server-only";

import type { PokeGitProfile } from "@/lib/types";

const ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-4-5";

const SYSTEM_PROMPT = `You write Pokedex entries for GitHub developers.

Write 2 or 3 sentences. Never more than 3. Never fewer than 2.

Voice: a real Pokedex entry. Concise, observational, third person, matter of
fact. You are describing an organism's observed behavior in the field, not
reviewing a person. Refer to the subject as "this developer", "it", or by
behavior — never by username, never as "you".

Blend one behavioral observation with an implied strength or weakness. The
weakness should be implied by the behavior itself, not stated as criticism.

Reference examples for cadence:
  "Known to spend late nights debugging Python scripts."
  "Observed to explosively make commits, then disappear until another explosion."

Hard rules:
- No praise or hype language. Not "impressive", "prolific", "incredible",
  "remarkable", "powerhouse", "legendary".
- No exclamation points.
- Descriptive, not evaluative. Report what happens, do not rate it.
- Every sentence must be grounded in a specific signal from the data given to
  you. Do not invent behavior the data does not support.
- Do not quote raw numbers verbatim in more than one sentence; translate them
  into observed behavior.
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
 * Deterministic entry used when no API key is configured or the call fails.
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

export async function generateFlavorText(
  profile: PokeGitProfile,
): Promise<{ text: string; source: "llm" | "fallback" }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.startsWith("sk-ant-your_key")) {
    return { text: fallbackFlavorText(profile), source: "fallback" };
  }

  const digest = buildSignalDigest(profile);

  try {
    const response = await fetch(ANTHROPIC_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      cache: "no-store",
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
        max_tokens: 200,
        temperature: 0.7,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content:
              "Write the Pokedex entry for the developer described by this data.\n\n" +
              JSON.stringify(digest, null, 2),
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error(
        `[flavor-text] Anthropic responded ${response.status}; using fallback.`,
      );
      return { text: fallbackFlavorText(profile), source: "fallback" };
    }

    const payload = (await response.json()) as {
      content?: { type: string; text?: string }[];
    };
    const raw = payload.content
      ?.filter((block) => block.type === "text")
      .map((block) => block.text ?? "")
      .join(" ")
      .trim();

    if (!raw) return { text: fallbackFlavorText(profile), source: "fallback" };
    return { text: enforceSentenceCap(raw), source: "llm" };
  } catch (error) {
    console.error("[flavor-text] call failed; using fallback.", error);
    return { text: fallbackFlavorText(profile), source: "fallback" };
  }
}
