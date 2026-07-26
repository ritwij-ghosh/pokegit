/**
 * Format a sequential Pokédex entry number for display (NO. 001, NO. 1000, …).
 * Pads to three digits; values ≥1000 render in full.
 */
export function formatDexNumber(entryNumber: number): string {
  return String(entryNumber).padStart(3, "0");
}

/**
 * Decorative fallback when Supabase is offline / for design-lab samples.
 * Stable per username but not globally unique or insertion-ordered.
 */
export function dexNumber(login: string): string {
  let hash = 2166136261;
  for (let i = 0; i < login.length; i++) {
    hash ^= login.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return formatDexNumber((Math.abs(hash) % 998) + 1);
}
