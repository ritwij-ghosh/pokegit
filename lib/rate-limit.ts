/**
 * Lightweight in-process rate limiters.
 *
 * Good enough for a single Node/Vercel instance. Limits are best-effort across
 * concurrent isolates — the DB claim in lib/pokedex-entries.ts is the real
 * guard against double-generation.
 */

import "server-only";

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

/** Sliding-window limiter. Returns true when the call is allowed. */
export function allowRequest(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    buckets.set(key, bucket);
    return false;
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return true;
}

/** Minimum spacing between Groq calls on this instance. */
let lastGroqCallAt = 0;
let groqChain: Promise<void> = Promise.resolve();

export async function withGroqSpacing<T>(
  fn: () => Promise<T>,
  minGapMs = 600,
): Promise<T> {
  const run = groqChain.then(async () => {
    const wait = Math.max(0, lastGroqCallAt + minGapMs - Date.now());
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastGroqCallAt = Date.now();
    return fn();
  });

  // Keep the chain alive even if this call fails.
  groqChain = run.then(
    () => undefined,
    () => undefined,
  );

  return run;
}
