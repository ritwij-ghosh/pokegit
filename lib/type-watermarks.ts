/**
 * Tiled SVG mask URLs for type watermarks on the card body.
 *
 * Each tile places two glyphs on a diagonal with slight rotation so the
 * repeat reads as a printed texture, not a rigid grid.
 */

import { TYPE_GLYPH_PATHS } from "@/lib/type-glyphs";
import type { PokemonType } from "@/lib/types";

const TILE = 96;
const GLYPH = 30;
const SCALE = GLYPH / 24;

function glyph(
  path: string,
  x: number,
  y: number,
  rotate: number,
): string {
  const cx = GLYPH / 2;
  const cy = GLYPH / 2;
  return (
    `<path fill="black" transform="translate(${x} ${y}) rotate(${rotate} ${cx} ${cy}) scale(${SCALE})" d="${path}"/>`
  );
}

function tileUrl(path: string): string {
  // Two staggered marks — denser diagonal rhythm when repeated.
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${TILE}" viewBox="0 0 ${TILE} ${TILE}">` +
    glyph(path, 10, 8, -22) +
    glyph(path, 52, 50, 14) +
    `</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** CSS `mask-image` value per Pokemon type. */
export const TYPE_WATERMARKS: Record<PokemonType, string> = (
  Object.keys(TYPE_GLYPH_PATHS) as PokemonType[]
).reduce(
  (acc, type) => {
    acc[type] = tileUrl(TYPE_GLYPH_PATHS[type]);
    return acc;
  },
  {} as Record<PokemonType, string>,
);
