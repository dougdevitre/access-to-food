export const MAX_MEALS_PER_SHIFT = Number(process.env.MAX_MEALS_PER_SHIFT ?? 900);
export const MIN_ELAPSED_MS = 55_000;
export const MAX_ELAPSED_MS = 15 * 60_000;

// Deliberately small; initials are 1-3 uppercase letters so keep it targeted.
const INITIALS_BLOCKLIST = new Set(["ASS", "FAG", "FUK", "FCK", "KKK", "NIG", "SEX", "TIT", "CUM", "DIE"]);

export function sanitizeInitials(raw: string): string | null {
  const s = (raw ?? "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
  if (!/^[A-Z]{1,3}$/.test(s)) return null;
  if (INITIALS_BLOCKLIST.has(s)) return null;
  return s;
}

export function validEventCode(code: string): boolean {
  return /^[A-Z0-9]{3,8}$/.test(code);
}

export function elapsedOk(iat: number, now = Date.now()): boolean {
  const d = now - iat;
  return d >= MIN_ELAPSED_MS && d <= MAX_ELAPSED_MS;
}

export function plausibleScore(meals: number, lbs: number, flagged: number): boolean {
  if (![meals, lbs, flagged].every((n) => Number.isInteger(n) && n >= 0)) return false;
  if (meals > MAX_MEALS_PER_SHIFT) return false;
  if (lbs > MAX_MEALS_PER_SHIFT * 2) return false;
  if (flagged > 60) return false;
  // meals must be consistent with lbs at ~1.2 lbs/meal (allow ±1 rounding)
  return Math.abs(meals - Math.round(lbs / 1.2)) <= 1;
}

// Crockford base32 without lookalikes for server-generated event codes
const CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export function generateEventCode(rand: () => number = Math.random): string {
  let out = "";
  for (let i = 0; i < 5; i++) out += CODE_ALPHABET[Math.floor(rand() * CODE_ALPHABET.length)];
  return out;
}
