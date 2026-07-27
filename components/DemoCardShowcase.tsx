import Link from "next/link";
import type { CSSProperties } from "react";

import PokeCard from "@/components/PokeCard";
import { dexNumber } from "@/lib/dex";
import { toCardMoves } from "@/lib/moves";
import { getPokeGitProfile } from "@/lib/profile";
import { DEMO_USERNAMES } from "@/lib/site";
import type { PokeGitProfile } from "@/lib/types";

async function loadDemoProfile(
  username: string,
): Promise<PokeGitProfile | null> {
  try {
    return await getPokeGitProfile(username);
  } catch {
    return null;
  }
}

/**
 * GitFut-style bottom-anchored fan: cards share a center origin, tip outward,
 * and stack left-over-right so the lead card reads as the hero.
 */
const FAN = [
  { x: "-128px", y: "18px", rotate: "-10deg", z: 40 },
  { x: "0px", y: "4px", rotate: "0deg", z: 35 },
  { x: "128px", y: "18px", rotate: "10deg", z: 30 },
] as const;

const CARD_WIDTH = "min(200px, 56vw)";

export async function DemoCardShowcase() {
  const profiles = (
    await Promise.all(DEMO_USERNAMES.map((name) => loadDemoProfile(name)))
  ).filter((profile): profile is PokeGitProfile => profile != null);

  if (profiles.length === 0) return null;

  return (
    <aside
      aria-label="Sample trainer cards"
      className="demo-fan relative w-full max-w-[560px] shrink-0"
    >
      {/* Soft glow behind the fan, matching gitfut's halo. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[22rem] w-[28rem]
                   -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-3xl
                   max-[860px]:top-[40%]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--sun-yellow) 28%, transparent) 0%, color-mix(in srgb, var(--accent-soft) 80%, transparent) 42%, transparent 72%)",
        }}
      />

      <div
        className="relative mx-auto h-[340px] w-[min(560px,98%)]
                   max-[860px]:flex max-[860px]:h-auto max-[860px]:w-full
                   max-[860px]:flex-col max-[860px]:items-center max-[860px]:gap-5"
      >
        {profiles.map((profile, index) => {
          const login = profile.profile.login;
          const dex = dexNumber(login);
          const { stats, typing, ability, moves } = profile;
          const fan = FAN[index] ?? FAN[FAN.length - 1];

          return (
            <Link
              key={login}
              href={`/${login}`}
              className="demo-fan-card absolute left-1/2 top-[14px] w-[200px] origin-bottom
                         max-[860px]:static max-[860px]:w-[min(230px,66vw)]
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2
                         focus-visible:ring-offset-[var(--background)]"
              style={
                {
                  zIndex: fan.z,
                  "--fan-x": fan.x,
                  "--fan-y": fan.y,
                  "--fan-r": fan.rotate,
                } as CSSProperties
              }
            >
              <div
                className="rise"
                style={{ animationDelay: `${120 + index * 90}ms` }}
              >
                <PokeCard
                  username={login}
                  type={typing.primary}
                  hp={stats.hp}
                  languageColor={typing.color}
                  languageName={typing.primaryLanguage}
                  avatarUrl={profile.profile.avatarUrl}
                  dexNumber={dex}
                  moves={toCardMoves(moves)}
                  width={CARD_WIDTH}
                  allowImageUpload={false}
                  abilityName={ability.name}
                />
              </div>
              <span className="sr-only">{login}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

export function DemoCardShowcaseFallback() {
  return (
    <aside
      aria-hidden
      className="demo-fan relative w-full max-w-[560px] shrink-0"
    >
      <div
        className="relative mx-auto h-[340px] w-[min(560px,98%)]
                   max-[860px]:flex max-[860px]:h-auto max-[860px]:w-full
                   max-[860px]:flex-col max-[860px]:items-center max-[860px]:gap-5"
      >
        {FAN.map((fan, index) => (
          <div
            key={DEMO_USERNAMES[index] ?? index}
            className="demo-fan-card absolute left-1/2 top-[14px] h-[280px] w-[200px]
                       origin-bottom border-2 border-dashed border-[var(--border)]
                       bg-[var(--surface)]/50
                       max-[860px]:static max-[860px]:h-[20rem] max-[860px]:w-[min(230px,66vw)]"
            style={
              {
                zIndex: fan.z,
                "--fan-x": fan.x,
                "--fan-y": fan.y,
                "--fan-r": fan.rotate,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </aside>
  );
}
