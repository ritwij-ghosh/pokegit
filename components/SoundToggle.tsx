"use client";

import { useEffect } from "react";

import { COPY } from "@/lib/copy";
import { writeSound } from "@/lib/prefs";
import { playBlip, playToggle } from "@/lib/sfx";
import { useSoundEnabled } from "@/lib/use-prefs";

export default function SoundToggle() {
  const enabled = useSoundEnabled();

  /**
   * Rather than wiring a handler onto every button in the app, one delegated
   * listener blips on any activated button or link. It stays installed
   * regardless of the preference because playBlip() no-ops when sound is off,
   * which keeps this effect free of dependencies.
   */
  useEffect(() => {
    let last = 0;
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest?.("button, a, [role='button']")) return;
      // The sound toggle plays its own confirmation instead.
      if (target.closest("[data-sfx='self']")) return;
      const now = Date.now();
      if (now - last < 60) return;
      last = now;
      playBlip();
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  const label = enabled ? COPY.prefs.soundOff : COPY.prefs.soundOn;

  return (
    <button
      type="button"
      data-sfx="self"
      role="switch"
      aria-checked={enabled}
      onClick={() => {
        writeSound(!enabled);
        // Fires only when switching on, which doubles as a volume preview.
        if (!enabled) playToggle();
      }}
      aria-label={label}
      title={label}
      className={`gba-btn flex h-9 w-9 items-center justify-center ${
        enabled ? "text-[var(--accent)]" : "text-[var(--muted)]"
      }`}
    >
      <SpeakerIcon muted={!enabled} />
    </button>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <rect x="2" y="6" width="2" height="4" />
      <rect x="4" y="5" width="2" height="6" />
      <rect x="6" y="3" width="2" height="10" />
      {muted ? (
        <>
          <rect x="10" y="5" width="2" height="2" />
          <rect x="12" y="7" width="2" height="2" />
          <rect x="10" y="9" width="2" height="2" />
          <rect x="14" y="5" width="2" height="2" />
          <rect x="14" y="9" width="2" height="2" />
        </>
      ) : (
        <>
          <rect x="10" y="6" width="1" height="4" />
          <rect x="12" y="4" width="1" height="8" />
          <rect x="14" y="2" width="1" height="12" />
        </>
      )}
    </svg>
  );
}
