/**
 * Language -> (linguist color, Pokemon type) mapping.
 *
 * Colors are NOT invented here. They come from
 * `/design-reference/language-colors.json`, which is a dump of GitHub's
 * linguist `languages.yml`. That file is the single source of truth for hex
 * values; this module only maps language names onto Pokemon types and exposes
 * lookup helpers.
 *
 * The Pokemon type table is intentionally a hand-maintained lookup (plan.md
 * section 4) and is expected to grow as new languages show up in real profiles.
 */

import languageData from "@/design-reference/language-colors.json";
import type { PokemonType } from "@/lib/types";

interface LinguistEntry {
  aliases: string[];
  color: string | null;
  type: string;
}

const LINGUIST: Record<string, LinguistEntry> = languageData as Record<
  string,
  LinguistEntry
>;

/** Fallback for languages with no linguist color (linguist leaves some null). */
export const DEFAULT_LANGUAGE_COLOR = "#8b949e";

/**
 * Canonical Pokemon type colors, used for type badges and energy pips.
 * These are the type identity colors, distinct from the language color that
 * drives the card body palette.
 */
export const POKEMON_TYPE_COLORS: Record<PokemonType, string> = {
  Normal: "#9099a1",
  Fire: "#ff9d55",
  Water: "#4d90d5",
  Electric: "#f4d23c",
  Grass: "#63bc5a",
  Ice: "#73cec0",
  Fighting: "#ce4069",
  Poison: "#ab6ac8",
  Ground: "#d97845",
  Flying: "#8fa8dd",
  Psychic: "#fa7179",
  Bug: "#90c12c",
  Rock: "#c7b78b",
  Ghost: "#5269ad",
  Dragon: "#0b6dc3",
  Dark: "#5a5465",
  Steel: "#5a8ea2",
  Fairy: "#ec8fe6",
};

/**
 * Hand-maintained language -> Pokemon type table.
 * Keys are canonical linguist language names.
 */
const LANGUAGE_TYPE_TABLE: Record<string, PokemonType> = {
  // Scripting / dynamic
  Python: "Grass",
  "Jupyter Notebook": "Grass",
  Ruby: "Fire",
  Perl: "Bug",
  Raku: "Bug",
  PHP: "Poison",
  Hack: "Poison",
  Lua: "Flying",
  Tcl: "Bug",
  Groovy: "Ground",

  // Web / frontend
  JavaScript: "Electric",
  TypeScript: "Electric",
  CoffeeScript: "Electric",
  Vue: "Electric",
  Svelte: "Electric",
  Astro: "Electric",
  HTML: "Normal",
  CSS: "Fairy",
  SCSS: "Fairy",
  Sass: "Fairy",
  Less: "Fairy",
  Stylus: "Fairy",
  Elm: "Fairy",
  ReScript: "Fairy",
  ReasonML: "Fairy",

  // Systems
  Rust: "Fire",
  Zig: "Fire",
  Nim: "Fire",
  V: "Fire",
  Cuda: "Fire",
  C: "Steel",
  "C++": "Steel",
  D: "Steel",
  WebAssembly: "Steel",
  Assembly: "Rock",
  "WebAssembly Interface Type": "Steel",

  // Managed / enterprise
  Java: "Ground",
  Kotlin: "Ground",
  Scala: "Psychic",
  "C#": "Psychic",
  "F#": "Psychic",
  "Visual Basic .NET": "Psychic",

  // Cloud / concurrency
  Go: "Water",
  Elixir: "Fairy",
  Erlang: "Fairy",
  Crystal: "Fairy",

  // Functional / academic
  Haskell: "Psychic",
  OCaml: "Psychic",
  "Standard ML": "Psychic",
  Clojure: "Psychic",
  "Emacs Lisp": "Ghost",
  "Common Lisp": "Psychic",
  Scheme: "Psychic",
  Racket: "Psychic",
  Idris: "Psychic",
  Agda: "Psychic",
  Coq: "Psychic",
  Lean: "Psychic",

  // Data / scientific
  R: "Psychic",
  Julia: "Psychic",
  MATLAB: "Psychic",
  Stata: "Psychic",
  SAS: "Psychic",

  // Apple
  Swift: "Ice",
  "Objective-C": "Ice",
  "Objective-C++": "Ice",
  Metal: "Ice",

  // Mobile / game
  Dart: "Flying",
  GDScript: "Flying",
  ActionScript: "Flying",
  HLSL: "Ice",
  GLSL: "Ice",
  ShaderLab: "Ice",

  // Shells / ops
  Shell: "Dark",
  PowerShell: "Dark",
  Batchfile: "Dark",
  Fish: "Dark",
  Zsh: "Dark",
  Dockerfile: "Steel",
  Makefile: "Steel",
  CMake: "Steel",
  Nix: "Ghost",
  HCL: "Steel",
  Starlark: "Steel",
  "Vim Script": "Ghost",
  "Vim Snippet": "Ghost",

  // Legacy / hardware
  Fortran: "Rock",
  COBOL: "Rock",
  Ada: "Rock",
  Pascal: "Rock",
  "Component Pascal": "Rock",
  Verilog: "Steel",
  VHDL: "Steel",
  SystemVerilog: "Steel",

  // Data / query
  SQL: "Water",
  PLpgSQL: "Water",
  TSQL: "Water",
  PLSQL: "Water",
  GraphQL: "Water",

  // Blockchain
  Solidity: "Dragon",
  Cairo: "Dragon",
  Move: "Dragon",
  Haxe: "Dragon",

  // Markup / config
  Markdown: "Normal",
  TeX: "Normal",
  Roff: "Normal",
  YAML: "Normal",
  JSON: "Normal",
  TOML: "Normal",
  XML: "Normal",
  "Rich Text Format": "Normal",
};

/**
 * Deterministic fallback for languages missing from the table above.
 *
 * Judgment call: rather than dumping every unknown language into "Normal",
 * we derive a type from the language's own linguist hue, so e.g. an unmapped
 * red language reads as Fire and an unmapped blue one reads as Water. Stable
 * across runs, and it degrades gracefully as new languages appear.
 */
const HUE_TYPE_WHEEL: PokemonType[] = [
  "Fire", // 0-29 red
  "Ground", // 30-59 orange
  "Electric", // 60-89 yellow
  "Grass", // 90-119 yellow-green
  "Grass", // 120-149 green
  "Fairy", // 150-179 teal-green
  "Water", // 180-209 cyan
  "Water", // 210-239 blue
  "Psychic", // 240-269 indigo
  "Ghost", // 270-299 violet
  "Poison", // 300-329 magenta
  "Fairy", // 330-359 pink
];

function hexToHue(hex: string): number | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const int = parseInt(m[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return null; // greyscale — no meaningful hue
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = Math.round(h * 60);
  return h < 0 ? h + 360 : h;
}

/** Case/alias-tolerant lookup into the linguist table. */
const ALIAS_INDEX: Record<string, string> = (() => {
  const index: Record<string, string> = {};
  for (const [name, entry] of Object.entries(LINGUIST)) {
    index[name.toLowerCase()] = name;
    for (const alias of entry.aliases ?? []) {
      if (!(alias.toLowerCase() in index)) index[alias.toLowerCase()] = name;
    }
  }
  return index;
})();

/** Resolve any language string (alias, different casing) to its linguist name. */
export function canonicalLanguageName(language: string): string {
  return ALIAS_INDEX[language.trim().toLowerCase()] ?? language;
}

export function languageColor(language: string): string {
  const canonical = canonicalLanguageName(language);
  return LINGUIST[canonical]?.color ?? DEFAULT_LANGUAGE_COLOR;
}

export function languageToPokemonType(language: string): PokemonType {
  const canonical = canonicalLanguageName(language);
  const mapped = LANGUAGE_TYPE_TABLE[canonical];
  if (mapped) return mapped;

  const hue = hexToHue(LINGUIST[canonical]?.color ?? "");
  if (hue === null) return "Normal";
  return HUE_TYPE_WHEEL[Math.floor(hue / 30) % HUE_TYPE_WHEEL.length];
}

/** True when linguist classifies this as an actual programming language. */
export function isProgrammingLanguage(language: string): boolean {
  const canonical = canonicalLanguageName(language);
  return LINGUIST[canonical]?.type === "programming";
}
