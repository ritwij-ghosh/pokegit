"use client";

import { COPY } from "@/lib/copy";
import { writeTheme, type ThemeName } from "@/lib/prefs";
import { playBlip } from "@/lib/sfx";
import { useTheme } from "@/lib/use-prefs";

export default function ThemeToggle() {
  const theme = useTheme();
  const next: ThemeName = theme === "authentic" ? "dark" : "authentic";
  const label =
    next === "authentic" ? COPY.prefs.themeToLight : COPY.prefs.themeToDark;

  return (
    <button
      type="button"
      onClick={() => {
        writeTheme(next);
        playBlip();
      }}
      aria-label={label}
      title={label}
      className="gba-btn flex h-9 w-9 items-center justify-center text-[var(--foreground)]"
    >
      {theme === "authentic" ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <rect x="6" y="4" width="4" height="1" />
      <rect x="5" y="5" width="6" height="1" />
      <rect x="4" y="6" width="8" height="4" />
      <rect x="5" y="10" width="6" height="1" />
      <rect x="6" y="11" width="4" height="1" />
      <rect x="7" y="0" width="2" height="2" />
      <rect x="7" y="14" width="2" height="2" />
      <rect x="0" y="7" width="2" height="2" />
      <rect x="14" y="7" width="2" height="2" />
      <rect x="2" y="2" width="2" height="2" />
      <rect x="12" y="2" width="2" height="2" />
      <rect x="2" y="12" width="2" height="2" />
      <rect x="12" y="12" width="2" height="2" />
    </svg>
  );
}

/** Crescent stepped row by row so the curve stays on the pixel grid. */
function MoonIcon() {
  const rows: Array<[y: number, x: number, width: number]> = [
    [2, 6, 5],
    [3, 4, 6],
    [4, 3, 6],
    [5, 3, 5],
    [6, 2, 5],
    [7, 2, 5],
    [8, 2, 5],
    [9, 2, 5],
    [10, 3, 5],
    [11, 3, 6],
    [12, 4, 6],
    [13, 6, 5],
  ];
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      {rows.map(([y, x, width]) => (
        <rect key={y} x={x} y={y} width={width} height="1" />
      ))}
    </svg>
  );
}
