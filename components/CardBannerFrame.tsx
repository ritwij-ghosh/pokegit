"use client";

import { forwardRef } from "react";

import { ExportScoutingStrip } from "@/components/ExportScoutingStrip";
import { ExportStatStrip } from "@/components/ExportStatStrip";
import { COPY } from "@/lib/copy";
import {
  exportThemeStyle,
  type ExportTheme,
} from "@/lib/export-theme";
import type { ShareCardStats } from "@/lib/share-posts";

import "./card-banner.css";

export interface CardBannerFrameProps {
  cardImageUrl: string;
  username: string;
  theme: ExportTheme;
  stats: ShareCardStats;
}

/**
 * Fixed 1920×1080 landscape banner for LinkedIn / X. Mounted offscreen and
 * captured as PNG — not shown in the live page chrome.
 */
const CardBannerFrame = forwardRef<HTMLDivElement, CardBannerFrameProps>(
  function CardBannerFrame({ cardImageUrl, username, theme, stats }, ref) {
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
        className="card-banner"
        style={exportThemeStyle(theme)}
        data-username={username}
        data-type={theme.type}
      >
        <div className="card-banner__watermark" aria-hidden="true" />
        <div className="card-banner__glare" aria-hidden="true" />

        <div className="card-banner__left">
          <div aria-hidden className="card-banner__glow" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="card-banner__card"
            src={cardImageUrl}
            alt=""
            draggable={false}
          />
        </div>

        <div className="card-banner__right">
          <header className="card-banner__brand">
            <div className="card-banner__wordmark">
              {head}
              <span className="card-banner__wordmark-tail">{tail}</span>
            </div>
            <p className="card-banner__tagline">{COPY.share.bannerTagline}</p>
          </header>

          <div className="card-banner__identity">
            <h1 className="card-banner__name">{username}</h1>
            <p className="card-banner__ability">{stats.abilityName}</p>
            <p className="card-banner__meta">
              NO. {stats.dexNumber}
              <span aria-hidden="true"> · </span>
              {stats.languageName}
              <span aria-hidden="true"> · </span>
              {typing}
            </p>
          </div>

          <ExportScoutingStrip stats={stats} className="card-banner-scout" />
          <ExportStatStrip stats={stats} className="card-banner-stats" />

          <p className="card-banner__cta">{COPY.share.bannerCta}</p>
        </div>
      </div>
    );
  },
);

export default CardBannerFrame;
