// Per-user identity. A unique, shareable player ID generated on first login
// and kept in localStorage (this device's "account"). Real cross-device lookup
// would require the backend user database.

const ID_KEY = "uno_userid";
// Unambiguous alphabet (no 0/O/1/I).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateId(): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return `UNO-${s}`;
}

/** Returns the user's unique ID, creating + persisting one on first call. */
export function getUserId(): string {
  let id = "";
  try { id = localStorage.getItem(ID_KEY) || ""; } catch { /* ignore */ }
  if (!id || !/^UNO-[A-Z2-9]{6}$/.test(id)) {
    id = generateId();
    try { localStorage.setItem(ID_KEY, id); } catch { /* ignore */ }
  }
  return id;
}

/** True if a string looks like a valid UNO player ID. */
export function isValidId(s: string): boolean {
  return /^UNO-[A-Z2-9]{6}$/.test(s.trim().toUpperCase());
}

/** Normalises user input toward the canonical ID format. */
export function normalizeId(s: string): string {
  let v = s.trim().toUpperCase().replace(/\s+/g, "");
  if (!v.startsWith("UNO-") && /^[A-Z2-9]{6}$/.test(v)) v = `UNO-${v}`;
  return v;
}
