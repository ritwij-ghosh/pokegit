import { POKEMON_TYPE_COLORS } from "@/lib/language-types";
import type { PokemonType } from "@/lib/types";

/**
 * Filled glyphs on a 24x24 grid, drawn to stay legible down to ~14px so the
 * same shapes work as energy pips on the card and as badges on the entry page.
 */
const GLYPHS: Record<PokemonType, string> = {
  Normal:
    "M12 3.2l2.35 5.15 5.65.6-4.2 3.8 1.15 5.55L12 15.5l-4.95 2.8 1.15-5.55-4.2-3.8 5.65-.6z",
  Fire: "M12.4 2.6c.3 2.6 1.9 3.6 3.1 5.2 1.3 1.7 1.9 3.3 1.9 5A5.4 5.4 0 0 1 12 18.4a5.4 5.4 0 0 1-5.4-5.6c0-2.6 1.7-4.3 2.7-6 .3 1 .8 1.7 1.6 2.2-.2-2.5.6-4.7 1.5-6.4zM12 12c-1 1.1-1.7 2-1.7 3a1.7 1.7 0 0 0 3.4 0c0-1-.7-1.9-1.7-3z",
  Water:
    "M12 2.8c3.1 3.6 6 7 6 10.2A6 6 0 0 1 6 13C6 9.8 8.9 6.4 12 2.8zm-2.6 8.4c-.5 0-.9.4-.9.9 0 1.8 1.4 3.3 3.2 3.5.5.1.9-.3.9-.8s-.3-.8-.8-.9c-1-.2-1.6-1-1.6-1.8 0-.5-.4-.9-.8-.9z",
  Electric: "M13.6 2L5.4 13.1h4.6L9 22l8.7-11.6h-4.9z",
  Grass:
    "M20.2 3.6c.4 5.6-.9 9.7-3.4 12-2 1.9-4.6 2.5-6.7 1.9l-1.9 3.3a.9.9 0 0 1-1.6-.9l1.9-3.3c-1.6-1.5-2.3-4-1.7-6.6.8-3.3 3.9-5.7 9.2-6.3zm-3.5 3.1c-3.2.7-5 2.3-5.5 4.5-.3 1.3-.1 2.6.4 3.5l4.2-7.2a.9.9 0 0 1 1.6.9l-4.2 7.2c1 .1 2.2-.3 3.2-1.2 1.5-1.4 2.4-3.8 2.5-7.4z",
  Ice: "M12 2a.9.9 0 0 1 .9.9v2.2l1.5-1.5a.9.9 0 0 1 1.3 1.3l-2.8 2.8v2.8l2.4-1.4 1-3.8a.9.9 0 0 1 1.8.5l-.6 2 1.9-1.1a.9.9 0 0 1 .9 1.6l-1.9 1.1 2 .5a.9.9 0 0 1-.4 1.8l-3.8-1-2.4 1.4 2.4 1.4 3.8-1a.9.9 0 0 1 .4 1.8l-2 .5 1.9 1.1a.9.9 0 1 1-.9 1.6l-1.9-1.1.6 2a.9.9 0 0 1-1.8.5l-1-3.8-2.4-1.4v2.8l2.8 2.8a.9.9 0 0 1-1.3 1.3l-1.5-1.5v2.2a.9.9 0 0 1-1.8 0v-2.2l-1.5 1.5a.9.9 0 0 1-1.3-1.3l2.8-2.8v-2.8l-2.4 1.4-1 3.8a.9.9 0 0 1-1.8-.5l.6-2-1.9 1.1a.9.9 0 0 1-.9-1.6l1.9-1.1-2-.5a.9.9 0 0 1 .4-1.8l3.8 1 2.4-1.4-2.4-1.4-3.8 1a.9.9 0 1 1-.4-1.8l2-.5-1.9-1.1a.9.9 0 0 1 .9-1.6l1.9 1.1-.6-2a.9.9 0 0 1 1.8-.5l1 3.8 2.4 1.4V7.7L8.3 4.9a.9.9 0 0 1 1.3-1.3l1.5 1.5V2.9A.9.9 0 0 1 12 2z",
  Fighting:
    "M7.5 3.2c1 0 1.7.8 1.7 1.7v3.4h.8V4.3a1.7 1.7 0 1 1 3.4 0v4h.8V5.6a1.7 1.7 0 1 1 3.4 0v7.2c0 4-2.6 7-6.3 7-2 0-3.6-.8-4.8-2.3l-2.2-3a1.6 1.6 0 0 1 2.4-2.1l1.1 1.1V4.9c0-.9.8-1.7 1.7-1.7z",
  Poison:
    "M12 2.6c3.1 3.7 6 7.1 6 10.3A6 6 0 0 1 6 12.9c0-3.2 2.9-6.6 6-10.3zM9.8 11.6a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zm4.4 0a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zM10 16.4h4v1.3h-4z",
  Ground:
    "M2.4 19.4l5.2-7.6 3.1 4.1 4-6.1 6.9 9.6zM8 4.2a2.3 2.3 0 1 1 0 4.6 2.3 2.3 0 0 1 0-4.6z",
  Flying:
    "M2.2 8.6c4-1.4 7.5-.6 10.5 2.3l1.8-3.6 1.6 4.6c1.9.4 3.8.2 5.7-.6-1.3 4.6-4.6 7.4-9.2 7.4-4.9 0-8.6-3.4-10.4-10.1z",
  Psychic:
    "M12 4.6c4.6 0 8.4 3 10 7.4-1.6 4.4-5.4 7.4-10 7.4S3.6 16.4 2 12c1.6-4.4 5.4-7.4 10-7.4zm0 3.2a4.2 4.2 0 1 0 0 8.4 4.2 4.2 0 0 0 0-8.4zm0 2a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4z",
  Bug: "M12 2.8c1.5 0 2.8.9 3.4 2.2l2.5-1.9a.9.9 0 1 1 1.1 1.4l-2.8 2.2c.2.5.3 1 .3 1.6h3.7a.9.9 0 0 1 0 1.8h-3.7v1.7h4.1a.9.9 0 0 1 0 1.8h-4.3c-.6 3-2.4 5-4.3 5s-3.7-2-4.3-5H3.4a.9.9 0 0 1 0-1.8h4.1v-1.7H3.8a.9.9 0 0 1 0-1.8h3.7c0-.6.1-1.1.3-1.6L5 4.5a.9.9 0 1 1 1.1-1.4l2.5 1.9A3.8 3.8 0 0 1 12 2.8z",
  Rock: "M11.2 2.4l7.6 4 2.1 7.9-5.6 6.4-8.3-1L3 12.1l3.5-7.3zM12 6.6l-4.4 2.6.9 5 4.9.9 3.1-3.7-1.2-4.1z",
  Ghost:
    "M12 2.6c4.4 0 7.6 3.3 7.6 7.9v10.2l-2.5-1.9-2.5 1.9-2.6-1.9-2.6 1.9-2.5-1.9-2.5 1.9V10.5c0-4.6 3.2-7.9 7.6-7.9zM9.4 8.4a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2zm5.2 0a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2z",
  Dragon: "M12 1.8l5.4 4.3-2 6.2L12 22.2l-3.4-9.9-2-6.2zm0 3.6L9.1 7.7l1 3.1h3.8l1-3.1z",
  Dark: "M14.6 2.6a9.4 9.4 0 1 0 6.8 12.2A7.6 7.6 0 0 1 14.6 2.6z",
  Steel:
    "M12 2l8.7 5v10L12 22l-8.7-5V7zm0 5.4A4.6 4.6 0 1 0 12 16.6 4.6 4.6 0 0 0 12 7.4zm0 2.2a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8z",
  Fairy:
    "M12 1.8c.6 3.9 1.6 6.4 3.4 8s4.3 2.4 7.4 2.2c-3.1.6-5.4 1.6-6.9 3.2-1.5 1.6-2.5 4-3.9 6.9-1.1-3.2-2.1-5.5-3.6-7.1s-3.7-2.5-7.2-3c3.5-.2 6-1 7.6-2.6 1.6-1.6 2.6-4 3.2-7.6z",
};

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
        <path d={GLYPHS[type]} />
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
        <path d={GLYPHS[type]} />
      </svg>
    </span>
  );
}

export function TypeBadge({ type }: { type: PokemonType }) {
  const color = POKEMON_TYPE_COLORS[type];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-xs font-semibold tracking-wide"
      style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}
    >
      <TypeSymbol type={type} size={18} />
      {type}
    </span>
  );
}
