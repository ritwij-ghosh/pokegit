"use client";

import { useEffect, useRef, useState } from "react";

import CardShareMenu from "@/components/CardShareMenu";
import { DexBall } from "@/components/DexBall";
import { LanguageSymbol } from "@/components/LanguageSymbol";
import { TypeSymbol } from "@/components/TypeSymbol";
import { derivePalette } from "@/lib/card-palette";
import type { CardMove } from "@/lib/moves";
import type { ShareCardStats } from "@/lib/share-posts";
import { TYPE_BACKDROPS } from "@/lib/type-backdrops";
import { TYPE_WATERMARKS } from "@/lib/type-watermarks";
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
  /** Ability name shown as the stage badge and stamped on story export. */
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
  const backdrop = TYPE_BACKDROPS[type];
  const cardMoves = moves ?? placeholderMoves(type);

  const [customImage, setCustomImage] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const tiltRaf = useRef<number | null>(null);
  const reduceMotion = useRef(false);

  // Object URLs are only valid while held; release the previous one on change.
  useEffect(() => {
    return () => {
      if (customImage) URL.revokeObjectURL(customImage);
    };
  }, [customImage]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduceMotion.current = media.matches;
    const onChange = () => {
      reduceMotion.current = media.matches;
      const card = cardRef.current;
      if (!card) return;
      card.style.setProperty("--ry", "0deg");
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--glare-o", "0");
      card.classList.remove("is-tilting");
    };
    media.addEventListener("change", onChange);
    return () => {
      media.removeEventListener("change", onChange);
      if (tiltRaf.current != null) cancelAnimationFrame(tiltRaf.current);
    };
  }, []);

  function onPickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setCustomImage((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return URL.createObjectURL(file);
    });
  }

  function applyTilt(clientX: number, clientY: number) {
    const card = cardRef.current;
    if (!card || reduceMotion.current) return;

    // Measure against the untransformed stage so tilt doesn't feed back into itself.
    const rect = (card.parentElement ?? card).getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const px = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const py = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    const nx = px * 2 - 1;
    const ny = py * 2 - 1;
    // Keep the motion subtle — enough to read as physical, not a gimmick.
    const maxTilt = 9;

    card.style.setProperty("--ry", `${(nx * maxTilt).toFixed(2)}deg`);
    card.style.setProperty("--rx", `${(-ny * maxTilt).toFixed(2)}deg`);
    card.style.setProperty("--glare-x", `${(px * 100).toFixed(1)}%`);
    card.style.setProperty("--glare-y", `${(py * 100).toFixed(1)}%`);
    // Foil ribbon angle tracks horizontal pointer so the spectrum sweeps with tilt.
    card.style.setProperty("--foil-angle", `${(112 + nx * 32).toFixed(1)}deg`);
    card.style.setProperty("--glare-o", "0.55");
    card.classList.add("is-tilting");
  }

  function resetTilt() {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty("--ry", "0deg");
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--glare-o", "0");
    card.style.setProperty("--glare-x", "50%");
    card.style.setProperty("--glare-y", "42%");
    card.style.setProperty("--foil-angle", "118deg");
    card.classList.remove("is-tilting");
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reduceMotion.current) return;
    const { clientX, clientY } = event;
    if (tiltRaf.current != null) cancelAnimationFrame(tiltRaf.current);
    tiltRaf.current = requestAnimationFrame(() => {
      tiltRaf.current = null;
      applyTilt(clientX, clientY);
    });
  }

  const image = customImage ?? avatarUrl;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="pokecard-stage">
        <div
          ref={cardRef}
          className="pokecard"
          onPointerMove={onPointerMove}
          onPointerLeave={resetTilt}
          onPointerCancel={resetTilt}
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
              "--card-watermark": TYPE_WATERMARKS[type],
            } as React.CSSProperties
          }
        >
          <div className="pokecard__body" data-type={type}>
            {/* Header: name left, HP + type right (per layout-skeleton.md). */}
            <div className="pokecard__header">
              <div className="pokecard__name-wrap">
                <span className="pokecard__stage">{abilityName}</span>
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
                <LanguageSymbol
                  language={languageName}
                  size="calc(var(--cw) * 0.086)"
                />
              </div>
            </div>

            {/* Art window */}
            <div className="pokecard__art">
              <div
                className="pokecard__art-inner"
                data-type={type}
                style={
                  {
                    "--art-from": backdrop.from,
                    "--art-via": backdrop.via,
                    "--art-to": backdrop.to,
                    "--art-spot": backdrop.spot,
                    "--art-motif": backdrop.motif,
                  } as React.CSSProperties
                }
              >
                <span className="pokecard__art-motif" aria-hidden="true">
                  <TypeSymbol type={type} size="82%" monochrome />
                </span>
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
              <span className="pokecard__infobar-sep" aria-hidden="true" />
              <span>
                <b>{languageName}</b> Developer
              </span>
              <span className="pokecard__infobar-sep" aria-hidden="true" />
              <span>
                TYPE <b>{type}</b>
              </span>
            </div>

            {/* Moves */}
            <div className="pokecard__moves">
              {cardMoves.map((move) => (
                <div key={move.name} className="pokecard__move">
                  <div className="pokecard__rule" />
                  <div className="pokecard__move-head">
                    <span className="pokecard__pips">
                      {move.cost.map((cost, index) => (
                        <TypeSymbol
                          key={`${cost}-${index}`}
                          type={cost}
                          size="calc(var(--cw) * 0.056)"
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

            <div className="pokecard__credits">
              <span>
                <b>PokeGit</b>
              </span>
              <DexBall
                size="calc(var(--cw) * 0.048)"
                className="pokecard__mark"
                title="PokeGit"
                variant="outline"
              />
            </div>
          </div>
          <div className="pokecard__glare" aria-hidden="true" />
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
              stats={shareStats}
            />
          )}
        </div>
      )}
    </div>
  );
}
