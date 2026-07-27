/**
 * Original, synthesized sound effects. Nothing is loaded from disk and no
 * game audio is sampled - these are square/triangle oscillators shaped to sit
 * in the same register as handheld menu blips.
 *
 * Every entry point checks the sound preference first, so callers can fire
 * these unconditionally.
 *
 * Browsers keep AudioContext suspended until a real user gesture, so we warm
 * the context on the first pointer/key press and only schedule tones once it
 * is running.
 */

import { readSound } from "@/lib/prefs";

let context: AudioContext | null = null;
let unlockBound = false;

function ensureUnlockListeners() {
  if (typeof window === "undefined" || unlockBound) return;
  unlockBound = true;
  const unlock = () => {
    void resumeAudio();
  };
  // pointerdown covers mouse + touch; keydown covers keyboard activation.
  window.addEventListener("pointerdown", unlock, {
    capture: true,
    passive: true,
  });
  window.addEventListener("keydown", unlock, { capture: true, passive: true });
}

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  ensureUnlockListeners();
  if (!context) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  return context;
}

async function resumeAudio(): Promise<AudioContext | null> {
  const ctx = getContext();
  if (!ctx) return null;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return null;
    }
  }
  return ctx.state === "running" ? ctx : null;
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
  // Clicks are user gestures — resume synchronously in this turn when possible.
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();
  // Prefer scheduling after resume resolves if we are still suspended.
  if (ctx.state !== "running") {
    void resumeAudio().then((ready) => {
      if (!ready || !readSound()) return;
      tone(ready, { from: 720, to: 1180, start: 0, duration: 0.07, peak: 0.05 });
    });
    return;
  }
  tone(ctx, { from: 720, to: 1180, start: 0, duration: 0.07, peak: 0.05 });
}

/** Four-note rising figure for a completed action. ~260ms. */
export function playChime() {
  if (!readSound()) return;
  const ctx = getContext();
  if (!ctx) return;
  const play = (ready: AudioContext) => {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((frequency, index) => {
      tone(ready, {
        from: frequency,
        start: index * 0.062,
        duration: index === notes.length - 1 ? 0.18 : 0.07,
        peak: 0.045,
        wave: index === notes.length - 1 ? "triangle" : "square",
      });
    });
  };
  if (ctx.state === "running") {
    play(ctx);
    return;
  }
  void resumeAudio().then((ready) => {
    if (ready && readSound()) play(ready);
  });
}

/** Two-note confirmation used when a preference is switched on. */
export function playToggle() {
  if (!readSound()) return;
  const ctx = getContext();
  if (!ctx) return;
  const play = (ready: AudioContext) => {
    tone(ready, { from: 880, start: 0, duration: 0.05, peak: 0.045 });
    tone(ready, { from: 1318.5, start: 0.055, duration: 0.08, peak: 0.045 });
  };
  if (ctx.state === "running") {
    play(ctx);
    return;
  }
  void resumeAudio().then((ready) => {
    if (ready && readSound()) play(ready);
  });
}
