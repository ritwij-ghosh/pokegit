"use client";

import { useEffect, useRef, useState } from "react";

import CardShareMenu from "@/components/CardShareMenu";
import { TypeSymbol } from "@/components/TypeSymbol";
import { derivePalette } from "@/lib/card-palette";
import type { CardMove } from "@/lib/moves";
import type { ShareCardStats } from "@/lib/share-posts";
import type { PokemonType } from "@/lib/types";

import "./pokecard.css";

export type { CardMove };

/**
 * Fallback when a card is rendered without profile moves (design lab, etc.).
 */
export function placeholderMoves(type: PokemonType): CardMove[] {
  return [
    {
      name: "Force Push",
      cost: [type, type],
      damage: "40",
      text: "No move signals available for this preview card.",
    },
    {
      name: "Merge Conflict",
      cost: [type, type, "Normal"],
      damage: "90+",
      text: "Personalized moves are selected from GitHub contribution signals.",
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
  /** Render the share / download menu beneath the card. */
  showShare?: boolean;
  /** Ability name stamped on the story export. */
  abilityName?: string;
  /** Full stat snapshot for landscape social banners. */
  shareStats?: ShareCardStats;
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
  showShare = false,
  abilityName = "Unknown Ability",
  shareStats,
}: PokeCardProps) {
  const palette = derivePalette(languageColor, type);
  const cardMoves = moves ?? placeholderMoves(type);

  const [customImage, setCustomImage] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

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
        ref={cardRef}
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
              <img
                src={image}
                alt={`${username} avatar`}
                draggable={false}
                // Required so html-to-image can serialize remote avatars.
                crossOrigin={customImage ? undefined : "anonymous"}
              />
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

      {(allowImageUpload || showShare) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {allowImageUpload && (
            <>
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
            </>
          )}
          {showShare && shareStats && (
            <CardShareMenu
              cardRef={cardRef}
              username={username}
              abilityName={abilityName}
              glowColor={palette.accent}
              stats={shareStats}
            />
          )}
        </div>
      )}
    </div>
  );
}
