/**
 * Derives a usable palette from a language's linguist color.
 *
 * plan.md section 7 is explicit that this is not a hex-for-hex swap: raw
 * linguist colors are picked for legibility as 10px dots on github.com, not as
 * full card surfaces. Several are near-grey (C is #555555), several are
 * eye-searing (JavaScript is #f1e05a). Both need shaping before they can carry
 * a card.
 *
 * The rules:
 *  - Very desaturated languages borrow chroma from their Pokemon type color,
 *    so C reads as steel-blue rather than dead grey while still being C.
 *  - Saturation and lightness are clamped into a band that renders well on a
 *    card face, in both the pale body area and the saturated banner.
 */

import { POKEMON_TYPE_COLORS } from "@/lib/language-types";
import type { PokemonType } from "@/lib/types";

export interface CardPalette {
  /** Primary identity color. Safe on dark and light backgrounds. */
  accent: string;
  /** Darker edge used for the card border and rules. */
  deep: string;
  /** Saturated banner behind the card header/footer. */
  banner: string;
  /** Pale card body. */
  face: string;
  /** Slightly deeper pale tone for alternating rows and the art well. */
  faceDeep: string;
  /** Very light tint, used for the outer card frame. */
  frame: string;
  /** Ink color that reads on `face`. */
  ink: string;
  /** Translucent accent for glows on dark backgrounds. */
  glow: string;
}

interface Hsl {
  h: number;
  s: number;
  l: number;
}

export function hexToHsl(hex: string): Hsl {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return { h: 0, s: 0, l: 0.5 };

  let value = match[1];
  if (value.length === 3) {
    value = value
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const int = parseInt(value, 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;

  if (d === 0) return { h: 0, s: 0, l };

  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = h * 60;
  if (h < 0) h += 360;

  return { h, s, l };
}

export function hslToHex({ h, s, l }: Hsl): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Shortest-path hue interpolation, so red + magenta does not detour via green. */
function mixHue(a: number, b: number, t: number): number {
  const delta = ((b - a + 540) % 360) - 180;
  return (a + delta * t + 360) % 360;
}

/** Below this saturation a language color cannot carry a card on its own. */
const CHROMA_FLOOR = 0.22;
/** Below this there is no meaningful hue to preserve at all (pure grey). */
const ACHROMATIC = 0.06;

export function derivePalette(
  languageHex: string,
  pokemonType: PokemonType,
): CardPalette {
  const language = hexToHsl(languageHex);
  const type = hexToHsl(POKEMON_TYPE_COLORS[pokemonType]);

  // Rescue near-grey languages by pulling them toward their type's hue.
  // A pure grey has no hue to interpolate from — interpolating out of h=0
  // would drag it through magenta — so take the type hue outright.
  const rescue =
    language.s < CHROMA_FLOOR
      ? clamp(1 - language.s / CHROMA_FLOOR, 0, 1) * 0.8
      : 0;

  const h =
    language.s < ACHROMATIC
      ? type.h
      : rescue > 0
        ? mixHue(language.h, type.h, rescue)
        : language.h;

  // Saturation is rebuilt rather than inherited: linguist colors range from
  // dead grey to fully blown out, and a card needs a predictable band.
  const s = clamp(language.s * (1 - rescue) + type.s * rescue, 0.42, 0.92);

  // Lightness is fixed per surface. Inheriting the language's own lightness
  // made dark languages produce muddy cards and pale ones produce invisible
  // frames; only hue and chroma should carry the language's identity.
  // The reference cards separate their frame from their body mainly by hue
  // (yellow border, orange body). Working from a single language hue, that
  // separation has to come from value and chroma instead: a vivid frame
  // against a body that runs pale at the top into saturated at the bottom.
  return {
    accent: hslToHex({ h, s: clamp(s * 1.05, 0.5, 0.9), l: 0.45 }),
    deep: hslToHex({ h, s: clamp(s, 0.45, 0.85), l: 0.22 }),
    banner: hslToHex({ h, s: clamp(s * 1.05, 0.55, 0.92), l: 0.52 }),
    face: hslToHex({ h, s: clamp(s * 0.9, 0.45, 0.82), l: 0.85 }),
    faceDeep: hslToHex({ h, s: clamp(s * 1.05, 0.55, 0.88), l: 0.58 }),
    frame: hslToHex({ h, s: clamp(s * 1.15, 0.68, 0.95), l: 0.67 }),
    ink: hslToHex({ h, s: 0.45, l: 0.12 }),
    glow: hslToHex({ h, s: clamp(s, 0.5, 0.9), l: 0.58 }),
  };
}
