"use client";

import { useSyncExternalStore } from "react";

import { PREFS_EVENT, readSound, readTheme, type ThemeName } from "@/lib/prefs";

function subscribe(onChange: () => void) {
  window.addEventListener(PREFS_EVENT, onChange);
  // Keeps duplicate tabs in agreement.
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(PREFS_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Null until hydration completes. The server has no way to know the stored
 * theme, so the server snapshot is deliberately empty and callers render a
 * neutral state for that first pass.
 */
export function useTheme(): ThemeName | null {
  return useSyncExternalStore(subscribe, readTheme, () => null);
}

export function useSoundEnabled(): boolean {
  return useSyncExternalStore(subscribe, readSound, () => false);
}
