"use client";

import { forwardRef } from "react";

import { COPY } from "@/lib/copy";

import "./card-story.css";

export interface CardStoryFrameProps {
  cardImageUrl: string;
  abilityName: string;
  glowColor: string;
  username: string;
}

/**
 * Fixed 1080×1920 story composition. Mounted offscreen and captured as PNG —
 * not shown in the live page chrome.
 */
const CardStoryFrame = forwardRef<HTMLDivElement, CardStoryFrameProps>(
  function CardStoryFrame(
    { cardImageUrl, abilityName, glowColor, username },
    ref,
  ) {
    const [head, tail] = [
      COPY.brand.wordmark.slice(0, 4),
      COPY.brand.wordmark.slice(4),
    ];

    return (
      <div
        ref={ref}
        className="card-story"
        style={{ "--story-glow": glowColor } as React.CSSProperties}
        data-username={username}
      >
        <header className="card-story__brand">
          <div className="card-story__wordmark">
            {head}
            <span className="card-story__wordmark-tail">{tail}</span>
          </div>
          <p className="card-story__tagline">{COPY.share.storyTagline}</p>
        </header>

        <div className="card-story__stage">
          <div aria-hidden className="card-story__glow" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="card-story__card"
            src={cardImageUrl}
            alt=""
            draggable={false}
          />
        </div>

        <footer className="card-story__footer">
          <p className="card-story__ability">{abilityName}</p>
          <p className="card-story__cta">{COPY.share.storyCta}</p>
        </footer>
      </div>
    );
  },
);

export default CardStoryFrame;
