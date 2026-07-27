import {
  languageIcon,
  languageMonogram,
} from "@/lib/language-icons";
import { languageColor } from "@/lib/language-types";
import { readableInk } from "@/lib/theme-accent";

/**
 * Circular language badge for the card header — brand mark when we have one,
 * letter monogram otherwise. Disc uses the linguist language color so the
 * badge reads as the language even when the Pokemon type (Electric, etc.)
 * stays on move costs and type labels elsewhere.
 */
export function LanguageSymbol({
  language,
  size = 20,
  className,
}: {
  language: string;
  /** A number of px, or any CSS length — the card passes calc() off its width. */
  size?: number | string;
  className?: string;
}) {
  const outer = typeof size === "number" ? `${size}px` : size;
  const inner = `calc(${outer} * 0.58)`;
  const disc = languageColor(language);
  const ink = readableInk(disc);
  const icon = languageIcon(language);
  const title = icon?.title ?? language;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${className ?? ""}`}
      style={{
        width: outer,
        height: outer,
        background: disc,
        boxShadow:
          "inset 0 1px 1.5px rgba(255,255,255,.55), inset 0 -1px 2px rgba(0,0,0,.28)," +
          "0 0 0 1px rgba(0,0,0,.32), 0 1px 2px rgba(0,0,0,.3)",
      }}
      title={title}
    >
      {icon ? (
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          fill={ink}
          style={{
            width: inner,
            height: inner,
            filter: "drop-shadow(0 1px 0 rgba(0,0,0,.25))",
          }}
        >
          <path d={icon.path} />
        </svg>
      ) : (
        <span
          aria-hidden
          style={{
            fontSize: `calc(${outer} * 0.42)`,
            fontWeight: 800,
            lineHeight: 1,
            color: ink,
            letterSpacing: "-0.04em",
            textShadow: "0 1px 0 rgba(0,0,0,.25)",
          }}
        >
          {languageMonogram(language)}
        </span>
      )}
    </span>
  );
}
