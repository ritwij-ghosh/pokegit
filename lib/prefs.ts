/**
 * Client-side preference storage for theme and sound.
 *
 * The theme has to be applied before first paint to avoid a flash, so the
 * read/apply logic is duplicated as a stringified inline script (THEME_BOOT
 * below) that runs in <head>. Keep the two in sync if the keys change.
 */

export type ThemeName = "authentic" | "dark";

export const THEME_KEY = "pokegit:theme";
export const SOUND_KEY = "pokegit:sound";

/** Fired on window whenever either preference changes in this tab. */
export const PREFS_EVENT = "pokegit:prefs";

export function readTheme(): ThemeName {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "authentic"
    ? "authentic"
    : "dark";
}

export function writeTheme(theme: ThemeName) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Private mode or storage disabled: the theme still applies for this page.
  }
  window.dispatchEvent(new CustomEvent(PREFS_EVENT));
}

/** Sound is opt-in, so anything other than an explicit "on" reads as off. */
export function readSound(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(SOUND_KEY) === "on";
  } catch {
    return false;
  }
}

export function writeSound(enabled: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, enabled ? "on" : "off");
  } catch {
    // Ignore; the toggle still reflects the choice for this page.
  }
  window.dispatchEvent(new CustomEvent(PREFS_EVENT));
}

/**
 * Runs synchronously in <head> before the body paints. Falls back to the OS
 * color scheme when the visitor has never picked a theme.
 */
export const THEME_BOOT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_KEY,
)});if(t!=="authentic"&&t!=="dark"){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches?"authentic":"dark";}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="dark";}})();`;
