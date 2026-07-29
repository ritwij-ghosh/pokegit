/** Canonical public origin — shares, exports, OG metadata, absolute links. */
export const SITE_ORIGIN = "https://pokegit.com";
export const SITE_HOST = "pokegit.com";
/** Card bottom-left credit / human-readable domain label. */
export const SITE_CREDIT = "PokeGit.com";

/** Public project identity — used by chrome CTAs (nav star, share, etc.). */
export const SITE_REPO = {
  owner: "ritwij-ghosh",
  name: "pokegit",
  url: "https://github.com/ritwij-ghosh/pokegit",
} as const;

/** Suggested scans on the landing page — also loaded as live demo cards. */
export const DEMO_USERNAMES = ["torvalds", "garrytan", "bcherny"] as const;

/** Founder credit for the site footer. */
export const SITE_FOUNDER = {
  name: "Ritwij Ghosh",
  email: "ritwij.ghosh@gmail.com",
  github: "https://github.com/ritwij-ghosh",
  linkedin: "https://www.linkedin.com/in/ritwij-ghosh",
} as const;
