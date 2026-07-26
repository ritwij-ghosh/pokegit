import type { Metadata } from "next";
import { Cabin, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Cabin is a humanist sans in the Gill Sans lineage, which is what the
 * Pokemon TCG uses for card names and attack text. Used only inside the card.
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${cabin.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
