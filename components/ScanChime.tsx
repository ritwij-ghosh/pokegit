"use client";

import { useEffect } from "react";

import { playChime } from "@/lib/sfx";

/**
 * Plays the completion chime once when a profile finishes resolving. Rendered
 * from the entry page, keyed on the login so a client-side navigation to a
 * different profile retriggers it. No-ops unless sound is switched on.
 */
export default function ScanChime() {
  useEffect(() => {
    playChime();
  }, []);

  return null;
}
