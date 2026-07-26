import type { Metadata, Viewport } from "next";
import { Cabin, Press_Start_2P, Silkscreen } from "next/font/google";
import "./globals.css";

import SiteHeader from "@/components/SiteHeader";
import { THEME_BOOT } from "@/lib/prefs";

/**
 * Press Start 2P (SIL OFL) is the display face: wordmark, page headings, nav
 * labels, primary buttons and section titles. It is far too chunky for
 * anything longer than a few words, so sizes stay small wherever it is used.
 */
const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  fallback: ["ui-monospace", "monospace"],
});

/**
 * Silkscreen (SIL OFL) is the body and data face: flavor text, metrics,
 * timestamps, language names. Same pixel grid, much higher legibility.
 */
const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "monospace"],
});

/**
 * Cabin is a humanist sans in the Gill Sans lineage, which is what the
 * Pokemon TCG uses for card names and attack text. Used only inside the card,
 * which is a trading-card pastiche rather than app chrome.
 */
const cabin = Cabin({
  variable: "--font-cabin",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PokeGit — your GitHub profile as a Pokedex entry",
  description:
    "Turn any public GitHub profile into a Pokedex entry and a Pokemon-style trading card: base stats, typing, ability and flavor text.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ece0c1" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1224" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${pressStart.variable} ${silkscreen.variable} ${cabin.variable} h-full antialiased`}
    >
      <head>
        {/* Applies the stored theme before first paint, so switching themes
            does not flash the other palette on reload. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
