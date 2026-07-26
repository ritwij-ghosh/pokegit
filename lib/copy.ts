/**
 * Every themed string in the UI lives here so the tone can be retuned without
 * hunting through components.
 *
 * House rule: flavor is allowed on chrome (loading, empty, error, taglines),
 * never on functional labels. Repos stay "repos", commits stay "commits",
 * stats stay named after what they measure.
 */

export const COPY = {
  brand: {
    wordmark: "PokeGit",
    kicker: "github x pokedex",
    tagline:
      "Every public GitHub profile is a species with observable habits. Enter a username to read its base stats, typing, ability and Pokedex entry.",
    footer: "no login / public data only / nothing stored",
  },

  home: {
    submitIdle: "SCAN",
    submitPending: "SCANNING",
    inputPlaceholder: "github username",
    tryPrompt: "try",
    tryTail: "or your own",
    highlights: [
      { label: "Six base stats", detail: "normalized 1-255 from real activity" },
      { label: "Dual typing", detail: "from the languages you actually write" },
      { label: "One of 25 abilities", detail: "picked by rules, not vibes" },
      { label: "Pokedex entry", detail: "written from your own numbers" },
    ],
  },

  loading: {
    title: "Scanning the tall grass...",
    detail:
      "Reading the contribution calendar, walking the repo list and sampling commit timestamps. This takes a few seconds.",
  },

  empty: {
    languages: {
      title: "No wild languages appeared.",
      detail:
        "This profile has no public code to read languages from, so typing fell back to defaults.",
    },
  },

  notFound: {
    kicker: "no entry found",
    title: "A wild 404 appeared!",
    detail:
      "There is no public GitHub profile by that name. Check the spelling, or scan a different trainer. PokeGit only reads public profiles.",
    back: "back to search",
  },

  error: {
    kicker: "scan failed",
    title: "The scan was interrupted!",
    back: "back to search",
  },

  profile: {
    unnamed: "Unnamed species",
    ageSuffix: "years in the wild",
    dexPrefix: "NO.",
    bstLabel: "Base stat total",
    entryLabel: "Pokedex entry",
    offlineBadge: "offline text",
    offlineHint:
      "Set ANTHROPIC_API_KEY in .env.local to generate this with the model.",
    viewOnGithub: "view on github",
    caveatsTitle: "How this was measured",
    panels: {
      stats: "Base stats",
      ability: "Ability",
      metrics: "Scouting metrics",
      languages: "Language distribution",
    },
  },

  prefs: {
    themeToLight: "Switch to Authentic (day) theme",
    themeToDark: "Switch to Dark (night) theme",
    soundOn: "Turn sound effects on",
    soundOff: "Turn sound effects off",
  },
} as const;
