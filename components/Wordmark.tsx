import { DexBall } from "@/components/DexBall";
import { COPY } from "@/lib/copy";

/**
 * Pixel wordmark, styled like a handheld title screen: display face, hard
 * offset shadow, and a small ball accent instead of a logo glyph.
 */
export default function Wordmark({
  size = "sm",
}: {
  size?: "sm" | "hero";
}) {
  const hero = size === "hero";
  const [head, tail] = [COPY.brand.wordmark.slice(0, 4), COPY.brand.wordmark.slice(4)];

  return (
    <span className={`inline-flex items-center ${hero ? "gap-4" : "gap-2"}`}>
      <DexBall size={hero ? 44 : 22} />
      <span
        className={`font-display leading-none text-[var(--foreground)] ${
          hero ? "text-[2rem] sm:text-[2.75rem]" : "text-[0.9rem]"
        }`}
        style={{
          textShadow: hero
            ? "4px 4px 0 var(--shadow-hard)"
            : "2px 2px 0 var(--shadow-hard)",
        }}
      >
        {head}
        <span className="text-[var(--accent)]">{tail}</span>
      </span>
    </span>
  );
}
