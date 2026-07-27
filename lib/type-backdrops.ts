/**
 * Per-type art-window backdrop recipes.
 *
 * Each card's art well paints a typed scene behind the avatar. Colors are
 * shaped from POKEMON_TYPE_COLORS — bright spot up top, saturated mid, deep
 * floor — so every type reads differently while the layout stays the same.
 */

import { POKEMON_TYPE_COLORS } from "@/lib/language-types";
import type { PokemonType } from "@/lib/types";

export type TypeBackdrop = {
  /** Top of the linear wash. */
  from: string;
  /** Mid stop. */
  via: string;
  /** Floor of the linear wash. */
  to: string;
  /** Soft radial highlight (upper-left). */
  spot: string;
  /** Motif glyph ink (rgba). Light on dark scenes, dark on pale ones. */
  motif: string;
};

const LIGHT_MOTIF = "rgba(255, 255, 255, 0.88)";
const DARK_MOTIF = "rgba(20, 16, 28, 0.55)";

/**
 * Hand-tuned scenes. Pattern is shared (spot + 165deg wash); chroma and
 * value shift per type so Fire feels hot, Ice feels cold, etc.
 */
export const TYPE_BACKDROPS: Record<PokemonType, TypeBackdrop> = {
  Normal: {
    from: "#d5dbe2",
    via: POKEMON_TYPE_COLORS.Normal,
    to: "#4a525a",
    spot: "#f4f6f8",
    motif: DARK_MOTIF,
  },
  Fire: {
    from: "#ffc48a",
    via: POKEMON_TYPE_COLORS.Fire,
    to: "#7a1f12",
    spot: "#ffe2b0",
    motif: LIGHT_MOTIF,
  },
  Water: {
    from: "#9fd0f5",
    via: POKEMON_TYPE_COLORS.Water,
    to: "#163a6b",
    spot: "#d8efff",
    motif: LIGHT_MOTIF,
  },
  Electric: {
    from: "#fff4a8",
    via: POKEMON_TYPE_COLORS.Electric,
    to: "#8a6a08",
    spot: "#fffceb",
    motif: DARK_MOTIF,
  },
  Grass: {
    from: "#b6e69a",
    via: POKEMON_TYPE_COLORS.Grass,
    to: "#1f4d22",
    spot: "#e4f7d4",
    motif: LIGHT_MOTIF,
  },
  Ice: {
    from: "#d9f7f2",
    via: POKEMON_TYPE_COLORS.Ice,
    to: "#2a5f62",
    spot: "#f2fffc",
    motif: DARK_MOTIF,
  },
  Fighting: {
    from: "#f0a0b4",
    via: POKEMON_TYPE_COLORS.Fighting,
    to: "#5c1428",
    spot: "#ffd0dc",
    motif: LIGHT_MOTIF,
  },
  Poison: {
    from: "#d9b3ef",
    via: POKEMON_TYPE_COLORS.Poison,
    to: "#3d1a55",
    spot: "#f0dcff",
    motif: LIGHT_MOTIF,
  },
  Ground: {
    from: "#f0c49a",
    via: POKEMON_TYPE_COLORS.Ground,
    to: "#5c2e14",
    spot: "#ffe8cc",
    motif: LIGHT_MOTIF,
  },
  Flying: {
    from: "#d0dcf5",
    via: POKEMON_TYPE_COLORS.Flying,
    to: "#2e3f6e",
    spot: "#eef3ff",
    motif: LIGHT_MOTIF,
  },
  Psychic: {
    from: "#ffb8bc",
    via: POKEMON_TYPE_COLORS.Psychic,
    to: "#6e1f3a",
    spot: "#ffdce0",
    motif: LIGHT_MOTIF,
  },
  Bug: {
    from: "#d4ef8a",
    via: POKEMON_TYPE_COLORS.Bug,
    to: "#3a5410",
    spot: "#eefcc0",
    motif: DARK_MOTIF,
  },
  Rock: {
    from: "#e8dcc0",
    via: POKEMON_TYPE_COLORS.Rock,
    to: "#5a4e32",
    spot: "#f7f1e2",
    motif: DARK_MOTIF,
  },
  Ghost: {
    from: "#8a9ad4",
    via: POKEMON_TYPE_COLORS.Ghost,
    to: "#1a2048",
    spot: "#c4ceef",
    motif: LIGHT_MOTIF,
  },
  Dragon: {
    from: "#6eb8f0",
    via: POKEMON_TYPE_COLORS.Dragon,
    to: "#061a40",
    spot: "#b8dcff",
    motif: LIGHT_MOTIF,
  },
  Dark: {
    from: "#8a8496",
    via: POKEMON_TYPE_COLORS.Dark,
    to: "#1a1620",
    spot: "#b8b2c4",
    motif: LIGHT_MOTIF,
  },
  Steel: {
    from: "#b8d4e0",
    via: POKEMON_TYPE_COLORS.Steel,
    to: "#1e3540",
    spot: "#e4f0f5",
    motif: LIGHT_MOTIF,
  },
  Fairy: {
    from: "#f9c8f5",
    via: POKEMON_TYPE_COLORS.Fairy,
    to: "#6e2a68",
    spot: "#ffe8fc",
    motif: LIGHT_MOTIF,
  },
};
