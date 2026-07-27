import DemoFan, { type DemoFanCard } from "@/components/DemoFan";
import { dexNumber } from "@/lib/dex";
import { toCardMoves } from "@/lib/moves";
import { getPokeGitProfile } from "@/lib/profile";
import { DEMO_USERNAMES } from "@/lib/site";
import type { PokeGitProfile } from "@/lib/types";
import type { CSSProperties } from "react";

async function loadDemoProfile(
  username: string,
): Promise<PokeGitProfile | null> {
  try {
    return await getPokeGitProfile(username);
  } catch {
    return null;
  }
}

function toFanCard(profile: PokeGitProfile): DemoFanCard {
  const login = profile.profile.login;
  return {
    login,
    type: profile.typing.primary,
    hp: profile.stats.hp,
    languageColor: profile.typing.color,
    languageName: profile.typing.primaryLanguage,
    avatarUrl: profile.profile.avatarUrl,
    dexNumber: dexNumber(login),
    moves: toCardMoves(profile.moves),
    abilityName: profile.ability.name,
  };
}

export async function DemoCardShowcase() {
  const profiles = (
    await Promise.all(DEMO_USERNAMES.map((name) => loadDemoProfile(name)))
  ).filter((profile): profile is PokeGitProfile => profile != null);

  if (profiles.length === 0) return null;

  return (
    <aside
      aria-label="Sample trainer cards"
      className="demo-fan relative w-full max-w-[660px] shrink-0 lg:flex-1"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[48%] h-[26rem] w-[34rem]
                   -translate-x-1/2 -translate-y-1/2 rounded-full opacity-80 blur-3xl
                   max-[860px]:top-[40%]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--sun-yellow) 30%, transparent) 0%, color-mix(in srgb, var(--accent-soft) 85%, transparent) 42%, transparent 72%)",
        }}
      />

      <DemoFan cards={profiles.map(toFanCard)} />
    </aside>
  );
}

export function DemoCardShowcaseFallback() {
  const FAN = [
    { x: "-172px", y: "20px", rotate: "-9deg", z: 40 },
    { x: "0px", y: "6px", rotate: "0deg", z: 35 },
    { x: "172px", y: "20px", rotate: "9deg", z: 30 },
  ] as const;

  return (
    <aside
      aria-hidden
      className="demo-fan relative w-full max-w-[660px] shrink-0 lg:flex-1"
    >
      <div
        className="relative mx-auto h-[400px] w-[min(660px,100%)]
                   max-[860px]:flex max-[860px]:h-auto max-[860px]:w-full
                   max-[860px]:flex-col max-[860px]:items-center max-[860px]:gap-6"
      >
        {FAN.map((fan, index) => (
          <div
            key={DEMO_USERNAMES[index] ?? index}
            className="demo-fan-card absolute left-1/2 top-[8px] h-[350px] w-[250px]
                       origin-bottom border-2 border-dashed border-[var(--border)]
                       bg-[var(--surface)]/50
                       max-[860px]:static max-[860px]:h-[22rem]
                       max-[860px]:w-[min(250px,78vw)]"
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
