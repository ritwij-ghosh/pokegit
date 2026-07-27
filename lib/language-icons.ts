/**
 * Language -> brand SVG path for the card header badge.
 *
 * Paths come from `simple-icons` (tree-shaken named imports). Linguist names
 * that have no trustworthy brand mark fall through to a letter monogram in
 * the UI — better than forcing a wrong logo (e.g. C# is not in simple-icons).
 */

import {
  siAda,
  siApachegroovy,
  siApple,
  siAstro,
  siC,
  siCmake,
  siClojure,
  siCoffeescript,
  siCommonlisp,
  siCplusplus,
  siCrystal,
  siCss,
  siDart,
  siDocker,
  siDotnet,
  siElixir,
  siElm,
  siErlang,
  siFishshell,
  siFortran,
  siFsharp,
  siGnubash,
  siGnuemacs,
  siGo,
  siGodotengine,
  siGraphql,
  siHaskell,
  siHaxe,
  siHcl,
  siHtml5,
  siJavascript,
  siJson,
  siJulia,
  siJupyter,
  siKotlin,
  siLatex,
  siLess,
  siLua,
  siMarkdown,
  siMysql,
  siNim,
  siNixos,
  siNvidia,
  siOcaml,
  siOctave,
  siOpenjdk,
  siOpengl,
  siPerl,
  siPhp,
  siPostgresql,
  siPython,
  siR,
  siRacket,
  siRescript,
  siRuby,
  siRust,
  siSass,
  siScala,
  siShell,
  siSolidity,
  siStylus,
  siSvelte,
  siSwift,
  siToml,
  siTypescript,
  siVim,
  siVuedotjs,
  siWebassembly,
  siXml,
  siYaml,
  siZig,
  siZsh,
  type SimpleIcon,
} from "simple-icons";

import { canonicalLanguageName } from "@/lib/language-types";

export interface LanguageIcon {
  title: string;
  path: string;
  /** Brand hex without '#'. */
  hex: string;
}

/** Explicit linguist-name -> icon map. Aliases resolve via canonicalLanguageName. */
const LANGUAGE_ICON_TABLE: Record<string, SimpleIcon> = {
  TypeScript: siTypescript,
  JavaScript: siJavascript,
  CoffeeScript: siCoffeescript,
  Python: siPython,
  "Jupyter Notebook": siJupyter,
  Rust: siRust,
  Go: siGo,
  C: siC,
  "C++": siCplusplus,
  "C#": siDotnet,
  "F#": siFsharp,
  "Visual Basic .NET": siDotnet,
  Java: siOpenjdk,
  Kotlin: siKotlin,
  Scala: siScala,
  Ruby: siRuby,
  PHP: siPhp,
  Swift: siSwift,
  "Objective-C": siApple,
  "Objective-C++": siApple,
  Dart: siDart,
  Lua: siLua,
  Perl: siPerl,
  R: siR,
  MATLAB: siOctave,
  Julia: siJulia,
  Haskell: siHaskell,
  OCaml: siOcaml,
  Clojure: siClojure,
  Elixir: siElixir,
  Erlang: siErlang,
  Crystal: siCrystal,
  Elm: siElm,
  ReScript: siRescript,
  Zig: siZig,
  Nim: siNim,
  WebAssembly: siWebassembly,
  HTML: siHtml5,
  CSS: siCss,
  SCSS: siSass,
  Sass: siSass,
  Less: siLess,
  Stylus: siStylus,
  Vue: siVuedotjs,
  Svelte: siSvelte,
  Astro: siAstro,
  Shell: siShell,
  Bash: siGnubash,
  Zsh: siZsh,
  Fish: siFishshell,
  Dockerfile: siDocker,
  Makefile: siCmake,
  CMake: siCmake,
  Nix: siNixos,
  HCL: siHcl,
  Markdown: siMarkdown,
  TeX: siLatex,
  YAML: siYaml,
  JSON: siJson,
  TOML: siToml,
  XML: siXml,
  SQL: siPostgresql,
  PLpgSQL: siPostgresql,
  GraphQL: siGraphql,
  Solidity: siSolidity,
  Haxe: siHaxe,
  Fortran: siFortran,
  Ada: siAda,
  Cuda: siNvidia,
  GLSL: siOpengl,
  GDScript: siGodotengine,
  "Emacs Lisp": siGnuemacs,
  "Common Lisp": siCommonlisp,
  Racket: siRacket,
  "Vim Script": siVim,
  Groovy: siApachegroovy,
};

function toIcon(icon: SimpleIcon): LanguageIcon {
  return { title: icon.title, path: icon.path, hex: icon.hex };
}

/** Brand mark for a linguist language name, or null when none is mapped. */
export function languageIcon(language: string): LanguageIcon | null {
  const canonical = canonicalLanguageName(language);
  const icon = LANGUAGE_ICON_TABLE[canonical];
  return icon ? toIcon(icon) : null;
}

/** Short glyph used when no brand SVG is available. */
export function languageMonogram(language: string): string {
  const name = canonicalLanguageName(language).trim();
  if (!name || name === "Unknown") return "?";

  // Keep compact marks like C++, C#, F#.
  if (/^[A-Za-z][#++]+/.test(name)) {
    return name.replace(/\s.*/, "").slice(0, 2);
  }

  const parts = name.split(/[\s/_-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  const alnum = name.replace(/[^A-Za-z0-9]/g, "");
  return (alnum[0] ?? name[0] ?? "?").toUpperCase();
}
