"use client";

import { useEffect, useRef, useState } from "react";

import { TypeSymbol } from "@/components/TypeSymbol";
import { derivePalette } from "@/lib/card-palette";
import type { PokemonType } from "@/lib/types";

import "./pokecard.css";

/**
 * v1 card (plan.md section 7): name, single type, HP, language-derived color,
 * avatar with upload override, and two moves whose *structure* is real while
 * their content is placeholder.
 *
 * Slots for weakness, resistance, retreat, stage, rarity and card number are
 * rendered as empty placeholders on purpose, so the composition already
 * accounts for the v2 content rather than being re-laid-out later.
 */

export interface CardMove {
  name: string;
  /** Energy cost, one pip per entry. */
  cost: PokemonType[];
  damage: string;
  text: string;
}

/**
 * PLACEHOLDER MOVES — v2 replaces these with moves derived from real signals.
 * Kept deliberately realistic in length so the layout is proved at both a
 * short and a long description.
 */
export function placeholderMoves(type: PokemonType): CardMove[] {
  return [
    {
      name: "Force Push",
      cost: [type, type],
      damage: "40",
      text: "Placeholder move. Real moves are derived from contribution signals in v2.",
    },
    {
      name: "Merge Conflict",
      cost: [type, type, "Normal"],
      damage: "90+",
      text: "Placeholder move. This description exists to prove a two-line attack body wraps correctly inside the frame.",
    },
  ];
}

export interface PokeCardProps {
  username: string;
  type: PokemonType;
  hp: number;
  /** Linguist hex for the top language — the palette is derived from it. */
  languageColor: string;
  languageName: string;
  avatarUrl: string;
  /** Stable 3-digit dex number shown in the info bar. */
  dexNumber: string;
  moves?: CardMove[];
  /**
   * Any CSS length. Everything inside the card is sized off this, so the card
   * scales as a single unit — pass a clamp/min() to make it fluid.
   */
  width?: string;
  /** Render the "use your own image" control beneath the card. */
  allowImageUpload?: boolean;
}

/** Long usernames have to shrink or they collide with the HP block. */
function nameFontScale(name: string): number {
  if (name.length <= 9) return 0.082;
  if (name.length <= 12) return 0.07;
  if (name.length <= 16) return 0.058;
  if (name.length <= 20) return 0.048;
  return 0.041;
}

export default function PokeCard({
  username,
  type,
  hp,
  languageColor,
  languageName,
  avatarUrl,
  dexNumber,
  moves,
  width = "min(430px, 88vw)",
  allowImageUpload = true,
}: PokeCardProps) {
  const palette = derivePalette(languageColor, type);
  const cardMoves = moves ?? placeholderMoves(type);

  const [customImage, setCustomImage] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Object URLs are only valid while held; release the previous one on change.
  useEffect(() => {
    return () => {
      if (customImage) URL.revokeObjectURL(customImage);
    };
  }, [customImage]);

  function onPickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setCustomImage((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return URL.createObjectURL(file);
    });
  }

  const image = customImage ?? avatarUrl;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="pokecard"
        style={
          {
            "--cw": width,
            "--card-accent": palette.accent,
            "--card-deep": palette.deep,
            "--card-banner": palette.banner,
            "--card-face": palette.face,
            "--card-face-deep": palette.faceDeep,
            "--card-frame": palette.frame,
            "--card-ink": palette.ink,
          } as React.CSSProperties
        }
      >
        <div className="pokecard__body">
          {/* Header: name left, HP + type right (per layout-skeleton.md). */}
          <div className="pokecard__header">
            <div className="pokecard__name-wrap">
              <span className="pokecard__stage">Basic</span>
              <span
                className="pokecard__name"
                style={{ fontSize: `calc(var(--cw) * ${nameFontScale(username)})` }}
                title={username}
              >
                {username}
              </span>
            </div>

            <div className="pokecard__hp">
              <span className="pokecard__hp-label">HP</span>
              <span className="pokecard__hp-value">{hp}</span>
              <TypeSymbol type={type} size="calc(var(--cw) * 0.086)" />
            </div>
          </div>

          {/* Art window */}
          <div className="pokecard__art">
            <div className="pokecard__art-inner">
              {/* Plain img: the source is either a remote avatar or a local
                  object URL, neither of which benefits from the image optimizer. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt={`${username} avatar`} draggable={false} />
            </div>
          </div>

          <div className="pokecard__infobar">
            <span>
              NO. <b>{dexNumber}</b>
            </span>
            <span>
              <b>{languageName}</b> Developer
            </span>
            <span>
              TYPE <b>{type}</b>
            </span>
          </div>

          {/* Moves */}
          <div className="pokecard__moves">
            {cardMoves.map((move) => (
              <div key={move.name}>
                <div className="pokecard__rule" />
                <div className="pokecard__move-head">
                  <span className="pokecard__pips">
                    {move.cost.map((cost, index) => (
                      <TypeSymbol
                        key={`${cost}-${index}`}
                        type={cost}
                        size="calc(var(--cw) * 0.053)"
                      />
                    ))}
                  </span>
                  <span className="pokecard__move-name">{move.name}</span>
                  <span className="pokecard__move-damage">{move.damage}</span>
                </div>
                <p className="pokecard__move-text">{move.text}</p>
              </div>
            ))}
            <div className="pokecard__rule" />
          </div>

          {/* v2 slots, laid out now so the composition does not shift later. */}
          <div className="pokecard__footerbar">
            <div>
              weakness <span className="pokecard__slot" />
            </div>
            <div>
              resistance <span className="pokecard__slot" />
            </div>
            <div>
              retreat <span className="pokecard__slot" />
            </div>
          </div>

          <div className="pokecard__credits">
            <span>
              <b>PokeGit.dev</b>
            </span>
            <span className="pokecard__setline">
              <span className="pokecard__slot" />
              <span>Illus. PokeGit</span>
            </span>
          </div>
        </div>
      </div>

      {allowImageUpload && (
        <div className="flex items-center gap-3">
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            onChange={onPickFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="gba-btn px-3 py-2 font-display text-[0.5rem] uppercase
                       text-[var(--foreground)]"
          >
            use your own image
          </button>
          {customImage && (
            <button
              type="button"
              onClick={() => {
                URL.revokeObjectURL(customImage);
                setCustomImage(null);
                if (fileInput.current) fileInput.current.value = "";
              }}
              className="text-[11px] text-[var(--muted)] underline decoration-dotted
                         underline-offset-4 transition hover:text-[var(--accent)]"
            >
              reset to avatar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
