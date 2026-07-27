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
    footer: "no login / public data only / entries cached once",
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
    bstHint: "Sum of the six base stats. Caps at 1530 (6 × 255).",
    entryLabel: "Pokedex entry",
    pendingBadge: "scanning",
    pendingEntry: "Pokédex data pending...",
    offlineBadge: "offline text",
    offlineHint:
      "Set GROQ_API_KEY (and Supabase) in .env.local to generate and cache this with the model.",
    viewOnGithub: "view on github",
    caveatsTitle: "How this was measured",
    panels: {
      stats: "Base stats",
      ability: "Ability",
      metrics: "Scouting metrics",
      languages: "Language distribution",
    },
    statHints: {
      hp: "Past-year contribution count, log-normalized onto 1–255.",
      attack: "Past-year commit count, log-normalized onto 1–255.",
      defense: "Code reviews given, log-normalized onto 1–255.",
      spAttack:
        "Stars earned plus top-repo stars (top repo counted twice), log-normalized onto 1–255.",
      spDefense: "Follower count, log-normalized onto 1–255.",
      speed:
        "Issue volume boosted by fast turnaround, log-normalized onto 1–255.",
    },
  },

  nav: {
    starLabel: "Star us on GitHub",
    starLabelShort: "Star us",
    starAria: "Star us on GitHub",
  },

  footer: {
    creditPrefix: "Created by",
    navLabel: "Creator links",
    email: "Email",
    github: "GitHub",
    linkedin: "LinkedIn",
  },

  prefs: {
    themeToLight: "Switch to Authentic (day) theme",
    themeToDark: "Switch to Dark (night) theme",
    soundOn: "Turn sound effects on",
    soundOff: "Turn sound effects off",
  },

  share: {
    button: "share card",
    copyImage: "Copy image",
    downloadPng: "Download PNG",
    downloadStory: "Download story",
    downloadBanner: "Download banner",
    copyLink: "Copy link",
    shareLinkedIn: "Share on LinkedIn",
    shareX: "Share on X",
    working: "Working...",
    copiedImage: "Copied to clipboard",
    copiedLink: "Link copied",
    saved: "Saved",
    bannerReady: "Banner saved — attach it to your post",
    popupBlocked: "Popup blocked — allow popups to post",
    error: "Couldn't export — try again",
    storyTagline: "YOUR GITHUB, SCANNED",
    storyCta: "TRY YOUR CARD ON POKEGIT.DEV →",
    bannerTagline: "GITHUB → POKEDEX CARD",
    bannerCta: "SCAN YOURS ON POKEGIT.DEV →",
  },

  docs: {
    navLabel: "GUIDE",
    homeLink: "how the dex works →",
    kicker: "field guide",
    title: "PokeGit DEX",
    intro:
      "Every public GitHub profile maps onto typing, base stats, one ability, and two moves. This page is the reference for those rules — the same numbers the scanner uses.",
    pipelineLead: "GitHub data becomes derived signals, then each system reads from those signals:",
    sections: {
      typing: "Typing",
      stats: "Base stats",
      ability: "Ability ladder",
      moves: "Move bank",
      caveats: "How measurement works",
      languages: "Language → type",
    },
    typingRule:
      "Primary type comes from the #1 language by bytes. A secondary type appears only when the #2 language has ≥5% share and maps to a different type. Programming languages are preferred over markup when any exist. Unmapped languages fall back to a hue wheel from their linguist color.",
    abilityRule:
      "Abilities are checked top-down. The first matching rule wins — earlier entries shadow later ones on purpose.",
    movesRule:
      "Each signal family has up to three tiered moves. The scanner keeps the highest tier per signal, ranks by strength, then fills two slots from different categories when possible. Sparse profiles get a Normal default per category.",
    caveats: [
      "Language bytes are sampled from the top 40 starred non-fork repos.",
      "Commit timing and message length come from up to 5 recently pushed repos.",
      "Repo lists cap at 1,000 public repos (10 pages × 100); large accounts may be truncated.",
      "Only public profile data is read. Private repos and private activity are invisible.",
      "Flavor text is generated once per username and cached; abilities and moves are flavor labels with no battle mechanics.",
    ],
    languageSearch: "Filter languages…",
    languageAllTypes: "All types",
    abilityExpand: "Condition",
    moveDefaultLabel: "Sparse-profile default",
    hueFallback:
      "Languages missing from the hand table get a type from their linguist hue (30° buckets). Greyscale falls back to Normal.",
  },
} as const;
