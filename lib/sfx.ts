/**
 * Two original, synthesized sound effects. Nothing is loaded from disk and no
 * game audio is sampled - these are square/triangle oscillators shaped to sit
 * in the same register as handheld menu blips.
 *
 * Every entry point checks the sound preference first, so callers can fire
 * these unconditionally.
 */

import { readSound } from "@/lib/prefs";

let context: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!context) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  // Browsers start the context suspended until a user gesture.
  if (context.state === "suspended") void context.resume();
  return context;
}

type ToneOptions = {
  from: number;
  to?: number;
  start: number;
  duration: number;
  peak: number;
  wave?: OscillatorType;
};

function tone(ctx: AudioContext, options: ToneOptions) {
  const { from, to = from, start, duration, peak, wave = "square" } = options;
  const at = ctx.currentTime + start;

  const osc = ctx.createOscillator();
  osc.type = wave;
  osc.frequency.setValueAtTime(from, at);
  if (to !== from) osc.frequency.linearRampToValueAtTime(to, at + duration);

  // Short attack, exponential tail - a raw gate would click.
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);

  osc.connect(gain).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + duration + 0.02);
}

/** Soft menu blip for navigation and button presses. ~70ms. */
export function playBlip() {
  if (!readSound()) return;
  const ctx = audio();
  if (!ctx) return;
  tone(ctx, { from: 720, to: 1180, start: 0, duration: 0.07, peak: 0.05 });
}

/** Four-note rising figure for a completed action. ~260ms. */
export function playChime() {
  if (!readSound()) return;
  const ctx = audio();
  if (!ctx) return;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((frequency, index) => {
    tone(ctx, {
      from: frequency,
      start: index * 0.062,
      duration: index === notes.length - 1 ? 0.18 : 0.07,
      peak: 0.045,
      wave: index === notes.length - 1 ? "triangle" : "square",
    });
  });
}

/** Two-note confirmation used when a preference is switched on. */
export function playToggle() {
  if (!readSound()) return;
  const ctx = audio();
  if (!ctx) return;
  tone(ctx, { from: 880, start: 0, duration: 0.05, peak: 0.045 });
  tone(ctx, { from: 1318.5, start: 0.055, duration: 0.08, peak: 0.045 });
}
