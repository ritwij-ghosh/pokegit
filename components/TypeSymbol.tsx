import { POKEMON_TYPE_COLORS } from "@/lib/language-types";
import { readableInk } from "@/lib/theme-accent";
import { TYPE_GLYPH_PATHS } from "@/lib/type-glyphs";
import type { PokemonType } from "@/lib/types";

export function TypeSymbol({
  type,
  size = 20,
  className,
  monochrome = false,
}: {
  type: PokemonType;
  /** A number of px, or any CSS length — the card passes calc() off its width. */
  size?: number | string;
  className?: string;
  /** Draw the glyph in currentColor with no colored disc behind it. */
  monochrome?: boolean;
}) {
  const outer = typeof size === "number" ? `${size}px` : size;
  const inner = `calc(${outer} * 0.62)`;

  if (monochrome) {
    return (
      <svg
        viewBox="0 0 24 24"
        style={{ width: outer, height: outer }}
        aria-hidden
        className={className}
        fill="currentColor"
      >
        <path d={TYPE_GLYPH_PATHS[type]} />
      </svg>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${className ?? ""}`}
      style={{
        width: outer,
        height: outer,
        background: POKEMON_TYPE_COLORS[type],
        boxShadow:
          "inset 0 1px 1.5px rgba(255,255,255,.55), inset 0 -1px 2px rgba(0,0,0,.28)," +
          "0 0 0 1px rgba(0,0,0,.32), 0 1px 2px rgba(0,0,0,.3)",
      }}
      title={type}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        fill="rgba(255,255,255,.95)"
        style={{
          width: inner,
          height: inner,
          filter: "drop-shadow(0 1px 0 rgba(0,0,0,.25))",
        }}
      >
        <path d={TYPE_GLYPH_PATHS[type]} />
      </svg>
    </span>
  );
}

/**
 * Square-cornered badge with a hard offset shadow, for the profile hero.
 *
 * Filled with the type color rather than tinted with it: a tint would have to
 * pick a text color that works on both the cream and navy panels, and half the
 * type colors (Electric, Rock, Ice) fail on one or the other.
 */
export function TypeBadge({ type }: { type: PokemonType }) {
  const color = POKEMON_TYPE_COLORS[type];
  return (
    <span
      className="inline-flex items-center gap-2 py-1 pl-1 pr-2.5 font-display text-[0.55rem] uppercase"
      style={{
        background: color,
        color: readableInk(color),
        border: "2px solid var(--ink)",
        boxShadow: "2px 2px 0 0 var(--shadow-hard)",
      }}
    >
      <TypeSymbol type={type} size={16} />
      {type}
    </span>
  );
}

/**
 * Compact type accent for dense rows (the language list). Sits alongside the
 * language name rather than replacing it - the label is still the source of
 * truth, the chip is just the color cue.
 */
export function TypeChip({ type }: { type: PokemonType }) {
  const color = POKEMON_TYPE_COLORS[type];
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 px-1.5 py-px text-[10px] uppercase tracking-wider"
      style={{
        background: color,
        color: readableInk(color),
        border: "1px solid var(--border)",
      }}
    >
      <TypeSymbol type={type} size={11} monochrome className="opacity-80" />
      {type}
    </span>
  );
}
