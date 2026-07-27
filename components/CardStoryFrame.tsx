"use client";

import { forwardRef } from "react";

import { ExportStatStrip } from "@/components/ExportStatStrip";
import { COPY } from "@/lib/copy";
import {
  exportThemeStyle,
  type ExportTheme,
} from "@/lib/export-theme";
import type { ShareCardStats } from "@/lib/share-posts";

import "./card-story.css";

export interface CardStoryFrameProps {
  cardImageUrl: string;
  username: string;
  theme: ExportTheme;
  stats: ShareCardStats;
}

/**
 * Fixed 1080×1920 story composition. Mounted offscreen and captured as PNG —
 * not shown in the live page chrome.
 */
const CardStoryFrame = forwardRef<HTMLDivElement, CardStoryFrameProps>(
  function CardStoryFrame({ cardImageUrl, username, theme, stats }, ref) {
    const [head, tail] = [
      COPY.brand.wordmark.slice(0, 4),
      COPY.brand.wordmark.slice(4),
    ];

    const typing = stats.secondaryType
      ? `${stats.primaryType} / ${stats.secondaryType}`
      : stats.primaryType;

    return (
      <div
        ref={ref}
        className="card-story"
        style={exportThemeStyle(theme)}
        data-username={username}
        data-type={theme.type}
      >
        <div className="card-story__watermark" aria-hidden="true" />
        <div className="card-story__glare" aria-hidden="true" />

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

        <section className="card-story__meta">
          <p className="card-story__ability">{stats.abilityName}</p>
          <p className="card-story__meta-line">
            NO. {stats.dexNumber}
            <span aria-hidden="true"> · </span>
            {stats.languageName}
            <span aria-hidden="true"> · </span>
            {typing}
          </p>
        </section>

        <ExportStatStrip stats={stats} className="card-story-stats" />

        <footer className="card-story__footer">
          <p className="card-story__cta">{COPY.share.storyCta}</p>
        </footer>
      </div>
    );
  },
);

export default CardStoryFrame;
