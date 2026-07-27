/**
 * Shared visual theme for offscreen story / banner exports.
 * Anchored on the same type palette + watermark as the live card.
 */

import type { CSSProperties } from "react";

import { derivePalette, type CardPalette } from "@/lib/card-palette";
import { TYPE_WATERMARKS } from "@/lib/type-watermarks";
import type { PokemonType } from "@/lib/types";

export interface ExportTheme extends CardPalette {
  type: PokemonType;
  watermark: string;
}

export function exportThemeForType(type: PokemonType): ExportTheme {
  const palette = derivePalette("#000000", type);
  return {
    ...palette,
    type,
    watermark: TYPE_WATERMARKS[type],
  };
}

/** CSS custom properties consumed by card-story / card-banner stylesheets. */
export function exportThemeStyle(theme: ExportTheme): CSSProperties {
  return {
    "--export-accent": theme.accent,
    "--export-deep": theme.deep,
    "--export-banner": theme.banner,
    "--export-face": theme.face,
    "--export-face-deep": theme.faceDeep,
    "--export-ink": theme.ink,
    "--export-glow": theme.glow,
    "--export-frame": theme.frame,
    "--export-watermark": theme.watermark,
  } as CSSProperties;
}
