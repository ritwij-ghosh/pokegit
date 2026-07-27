"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";

import PokeCard, { type CardMove } from "@/components/PokeCard";
import type { PokemonType } from "@/lib/types";

export interface DemoFanCard {
  login: string;
  type: PokemonType;
  hp: number;
  languageColor: string;
  languageName: string;
  avatarUrl: string;
  dexNumber: string;
  moves: CardMove[];
  abilityName: string;
}

const FAN = [
  { x: "-172px", y: "20px", rotate: "-9deg", z: 40 },
  { x: "0px", y: "6px", rotate: "0deg", z: 35 },
  { x: "172px", y: "20px", rotate: "9deg", z: 30 },
] as const;

const CARD_WIDTH = "min(250px, 68vw)";
const FRONT_Z = 60;

export default function DemoFan({ cards }: { cards: DemoFanCard[] }) {
  const [front, setFront] = useState<string | null>(null);

  return (
    <div
      className="relative mx-auto h-[400px] w-[min(660px,100%)]
                 max-[860px]:flex max-[860px]:h-auto max-[860px]:w-full
                 max-[860px]:flex-col max-[860px]:items-center max-[860px]:gap-6"
      onPointerLeave={() => setFront(null)}
    >
      {cards.map((card, index) => {
        const fan = FAN[index] ?? FAN[FAN.length - 1];
        const isFront = front === card.login;

        return (
          <Link
            key={card.login}
            href={`/${card.login}`}
            className={`demo-fan-card absolute left-1/2 top-[8px] w-[250px] origin-bottom
                        max-[860px]:static max-[860px]:w-[min(250px,78vw)]
                        focus-visible:outline-none focus-visible:ring-2
                        focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2
                        focus-visible:ring-offset-[var(--background)]
                        ${isFront ? "is-front" : ""}`}
            style={
              {
                zIndex: isFront ? FRONT_Z : fan.z,
                "--fan-x": fan.x,
                "--fan-y": fan.y,
                "--fan-r": fan.rotate,
              } as CSSProperties
            }
            onPointerEnter={() => setFront(card.login)}
            onFocus={() => setFront(card.login)}
          >
            <div
              className="rise"
              style={{ animationDelay: `${120 + index * 90}ms` }}
            >
              <PokeCard
                username={card.login}
                type={card.type}
                hp={card.hp}
                languageColor={card.languageColor}
                languageName={card.languageName}
                avatarUrl={card.avatarUrl}
                dexNumber={card.dexNumber}
                moves={card.moves}
                width={CARD_WIDTH}
                allowImageUpload={false}
                abilityName={card.abilityName}
              />
            </div>
            <span className="sr-only">{card.login}</span>
          </Link>
        );
      })}
    </div>
  );
}
