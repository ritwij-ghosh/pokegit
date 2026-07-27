"use client";

import {
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  type RefObject,
} from "react";
import { flushSync } from "react-dom";

import CardBannerFrame from "@/components/CardBannerFrame";
import CardStoryFrame from "@/components/CardStoryFrame";
import {
  captureElementBlob,
  captureElementPng,
  copyBlobToClipboard,
  copyTextToClipboard,
  downloadDataUrl,
  sharePageUrl,
} from "@/lib/card-export";
import { COPY } from "@/lib/copy";
import { exportThemeForType } from "@/lib/export-theme";
import {
  sharePost,
  siteHomeUrl,
  type ShareCardStats,
} from "@/lib/share-posts";
import { playBlip, playChime } from "@/lib/sfx";

type Status = "idle" | "working" | "ok" | "error";
type MenuActionId =
  | "copyImage"
  | "downloadPng"
  | "downloadStory"
  | "downloadBanner"
  | "copyLink";
type SocialPlatform = "linkedin" | "x";
type OffscreenKind = "story" | "banner";

const ACTIONS: { id: MenuActionId; label: string }[] = [
  { id: "copyImage", label: COPY.share.copyImage },
  { id: "downloadPng", label: COPY.share.downloadPng },
  { id: "downloadStory", label: COPY.share.downloadStory },
  { id: "downloadBanner", label: COPY.share.downloadBanner },
  { id: "copyLink", label: COPY.share.copyLink },
];

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden fill="currentColor">
      <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.24 8.25h4.52V24H.24V8.25zM8.34 8.25h4.33v2.14h.06c.6-1.14 2.08-2.34 4.28-2.34 4.58 0 5.43 3.01 5.43 6.93V24h-4.52v-7.43c0-1.77-.03-4.05-2.47-4.05-2.47 0-2.85 1.93-2.85 3.92V24H8.34V8.25z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden fill="currentColor">
      <path d="M18.9 2H22l-6.78 7.75L23.25 22h-6.55l-5.13-6.7L5.7 22H2.58l7.25-8.29L.75 2h6.72l4.63 6.13L18.9 2zm-1.15 18.15h1.82L6.38 3.75H4.43l13.32 16.4z" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      width="10"
      height="10"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="square"
      className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
    >
      <path d="M2 4.5 L6 8.5 L10 4.5" />
    </svg>
  );
}

export interface CardShareMenuProps {
  cardRef: RefObject<HTMLElement | null>;
  username: string;
  stats: ShareCardStats;
}

export default function CardShareMenu({
  cardRef,
  username,
  stats,
}: CardShareMenuProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [statusText, setStatusText] = useState("");
  const [offscreen, setOffscreen] = useState<{
    kind: OffscreenKind;
    image: string;
  } | null>(null);

  const theme = exportThemeForType(stats.primaryType);

  const close = useEffectEvent(() => {
    setOpen(false);
  });

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) close();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function flashStatus(next: Status, text: string, ms = 2800) {
    setStatus(next);
    setStatusText(text);
    window.setTimeout(() => {
      setStatus("idle");
      setStatusText("");
    }, ms);
  }

  async function mountOffscreen(
    kind: OffscreenKind,
    dataUrl: string,
  ): Promise<HTMLElement> {
    flushSync(() => {
      setOffscreen({ kind, image: dataUrl });
    });

    const root = kind === "story" ? storyRef.current : bannerRef.current;
    const img = root?.querySelector("img");
    if (!root || !img) throw new Error(`${kind} frame missing`);
    if (!img.complete) {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`${kind} image failed to load`));
      });
    }
    await document.fonts.ready;
    return root;
  }

  async function captureBannerPng(): Promise<string> {
    const card = cardRef.current;
    if (!card) throw new Error("Card missing");
    const cardPng = await captureElementPng(card, { pixelRatio: 2 });
    const banner = await mountOffscreen("banner", cardPng);
    return captureElementPng(banner, {
      pixelRatio: 1,
      width: 1920,
      height: 1080,
    });
  }

  async function runMenuAction(action: MenuActionId) {
    const card = cardRef.current;
    if (!card) return;

    setStatus("working");
    setStatusText(COPY.share.working);
    playBlip();

    try {
      if (action === "copyLink") {
        await copyTextToClipboard(sharePageUrl(username));
        flashStatus("ok", COPY.share.copiedLink);
        playChime();
        return;
      }

      if (action === "copyImage") {
        const blob = await captureElementBlob(card);
        await copyBlobToClipboard(blob);
        flashStatus("ok", COPY.share.copiedImage);
        playChime();
        return;
      }

      if (action === "downloadPng") {
        const dataUrl = await captureElementPng(card);
        downloadDataUrl(dataUrl, `pokegit-${username}.png`);
        flashStatus("ok", COPY.share.saved);
        playChime();
        return;
      }

      if (action === "downloadBanner") {
        const bannerPng = await captureBannerPng();
        downloadDataUrl(bannerPng, `pokegit-${username}-banner.png`);
        flashStatus("ok", COPY.share.saved);
        playChime();
        return;
      }

      const cardPng = await captureElementPng(card, { pixelRatio: 2 });
      const story = await mountOffscreen("story", cardPng);
      const storyPng = await captureElementPng(story, {
        pixelRatio: 1,
        width: 1080,
        height: 1920,
      });
      downloadDataUrl(storyPng, `pokegit-${username}-story.png`);
      flashStatus("ok", COPY.share.saved);
      playChime();
    } catch (error) {
      console.error(error);
      flashStatus("error", COPY.share.error);
    } finally {
      setOffscreen(null);
    }
  }

  /**
   * LinkedIn / X: bake a themed banner download, then open the composer.
   * Download first so a blocked popup still leaves the user with the asset.
   */
  async function shareTo(platform: SocialPlatform) {
    const card = cardRef.current;
    if (!card || status === "working") return;

    setStatus("working");
    setStatusText(COPY.share.working);
    playBlip();

    try {
      const bannerPng = await captureBannerPng();
      downloadDataUrl(bannerPng, `pokegit-${username}-banner.png`);

      const opened = sharePost(platform, {
        username,
        pageUrl: sharePageUrl(username),
        homeUrl: siteHomeUrl(),
        stats,
      });
      if (!opened) {
        flashStatus("error", COPY.share.popupBlocked);
        return;
      }

      flashStatus("ok", COPY.share.bannerReady, 3600);
      playChime();
    } catch (error) {
      console.error(error);
      flashStatus("error", COPY.share.error);
    } finally {
      setOffscreen(null);
    }
  }

  return (
    <>
      <div ref={rootRef} className="relative">
        <button
          type="button"
          className="gba-btn gba-btn-primary inline-flex items-center gap-2 px-3
                     py-2 font-display text-[0.5rem] uppercase"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          disabled={status === "working"}
          onClick={() => {
            playBlip();
            setOpen((value) => !value);
          }}
        >
          {COPY.share.button}
          <ChevronIcon open={open} />
        </button>

        {open && (
          <div
            id={menuId}
            role="menu"
            className="gba-panel absolute top-full left-1/2 z-20 mt-2 w-52
                       -translate-x-1/2 overflow-hidden py-1"
          >
            {ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                role="menuitem"
                disabled={status === "working"}
                className="block w-full px-3 py-2.5 text-left font-display
                           text-[0.45rem] uppercase leading-relaxed
                           text-[var(--foreground)] transition
                           hover:bg-[var(--surface-raised)]
                           disabled:opacity-55"
                onClick={() => {
                  setOpen(false);
                  void runMenuAction(action.id);
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        title={COPY.share.shareLinkedIn}
        aria-label={COPY.share.shareLinkedIn}
        disabled={status === "working"}
        className="gba-btn inline-flex h-[34px] w-[34px] items-center justify-center
                   text-[var(--foreground)] disabled:opacity-55"
        onClick={() => void shareTo("linkedin")}
      >
        <LinkedInIcon />
      </button>

      <button
        type="button"
        title={COPY.share.shareX}
        aria-label={COPY.share.shareX}
        disabled={status === "working"}
        className="gba-btn inline-flex h-[34px] w-[34px] items-center justify-center
                   text-[var(--foreground)] disabled:opacity-55"
        onClick={() => void shareTo("x")}
      >
        <XIcon />
      </button>

      {status !== "idle" && statusText && (
        <p
          role="status"
          className={`basis-full text-center font-card text-sm leading-relaxed tracking-normal ${
            status === "error"
              ? "text-[var(--pokedex-red)]"
              : "text-[var(--muted)]"
          }`}
        >
          {statusText}
        </p>
      )}

      {offscreen?.kind === "story" && (
        <div
          aria-hidden
          className="pointer-events-none fixed top-0 -left-[10000px]"
        >
          <CardStoryFrame
            ref={storyRef}
            cardImageUrl={offscreen.image}
            username={username}
            theme={theme}
            stats={stats}
          />
        </div>
      )}

      {offscreen?.kind === "banner" && (
        <div
          aria-hidden
          className="pointer-events-none fixed top-0 -left-[10000px]"
        >
          <CardBannerFrame
            ref={bannerRef}
            cardImageUrl={offscreen.image}
            username={username}
            theme={theme}
            stats={stats}
          />
        </div>
      )}
    </>
  );
}
