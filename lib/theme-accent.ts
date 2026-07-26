/**
 * Per-theme shaping for the profile's identity color.
 *
 * `typing.color` is a raw linguist hex, picked to read as a 10px dot on
 * github.com. Several are near-grey (C is #555555) and several are blown out
 * (JavaScript is #f1e05a), so one unmodified value cannot serve as text on
 * both a cream panel and a navy one. `derivePalette` already solves the
 * hue/chroma half of this for the card, so both themes start from it and stay
 * in the same color family as the card they sit beside; only lightness is
 * re-solved here, against the background the text will actually land on.
 */

import { derivePalette, hexToHsl, hslToHex } from "@/lib/card-palette";
import type { PokemonType } from "@/lib/types";

/**
 * Worst-case backgrounds the accent has to survive as text: the darkest of the
 * Authentic surfaces and the lightest of the Dark ones. Kept in sync with the
 * palettes in app/globals.css.
 */
const DAY_BACKDROP = "#ece0c1";
const NIGHT_BACKDROP = "#202a4a";

/** WCAG AA for large text. The accent is only ever used at heading sizes. */
const MIN_CONTRAST = 4.5;

export interface ThemeAccent {
  day: string;
  night: string;
}

export function themeAccent(
  languageHex: string,
  type: PokemonType,
): ThemeAccent {
  const base = hexToHsl(derivePalette(languageHex, type).accent);
  return {
    day: solveLightness(base, DAY_BACKDROP, -1),
    night: solveLightness(base, NIGHT_BACKDROP, 1),
  };
}

/**
 * Walks lightness in `direction` until the color clears MIN_CONTRAST against
 * `backdrop`. Stepping lightness rather than blending toward black/white keeps
 * the hue intact, which matters because the hue is the language's identity.
 */
function solveLightness(
  base: { h: number; s: number; l: number },
  backdrop: string,
  direction: 1 | -1,
): string {
  const target = luminance(backdrop);
  let l = base.l;

  for (let step = 0; step < 40; step += 1) {
    const candidate = hslToHex({ h: base.h, s: base.s, l });
    if (contrast(luminance(candidate), target) >= MIN_CONTRAST) return candidate;
    l += direction * 0.02;
    if (l <= 0.04 || l >= 0.97) break;
  }

  // Nothing on this hue clears the bar; fall back to the extreme we reached.
  return hslToHex({ h: base.h, s: base.s, l: Math.min(Math.max(l, 0.04), 0.97) });
}

/** Black or white, whichever survives on top of `hex`. */
export function readableInk(hex: string): string {
  return luminance(hex) > 0.42 ? "#14110b" : "#fdfcf7";
}

function contrast(a: number, b: number): number {
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/** WCAG relative luminance. Plain HSL lightness badly overrates yellows. */
function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2])
  );
}

function hexToRgb(hex: string): [number, number, number] | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  let value = match[1];
  if (value.length === 3) {
    value = value
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const int = parseInt(value, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}
