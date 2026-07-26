/**
 * A stable, meaningless-but-consistent three-digit dex number per username.
 * Purely decorative — it exists so the card and entry page have the "NO. 006"
 * line that every real card carries.
 */
export function dexNumber(login: string): string {
  let hash = 2166136261;
  for (let i = 0; i < login.length; i++) {
    hash ^= login.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return String((Math.abs(hash) % 998) + 1).padStart(3, "0");
}
