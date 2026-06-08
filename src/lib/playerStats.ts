// Lightweight, localStorage-backed player stats (UI only — no backend).
export interface PlayerStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  longestStreak: number;
  currentStreak: number;
  unoCalls: number;
  drawFours: number;
}

const KEY = "uno_stats";
const DEFAULT: PlayerStats = {
  gamesPlayed: 0, wins: 0, losses: 0, longestStreak: 0, currentStreak: 0, unoCalls: 0, drawFours: 0,
};

export function getStats(): PlayerStats {
  try {
    return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { ...DEFAULT };
  }
}

function save(s: PlayerStats) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function recordMatch(won: boolean): PlayerStats {
  const s = getStats();
  s.gamesPlayed += 1;
  if (won) {
    s.wins += 1;
    s.currentStreak += 1;
    s.longestStreak = Math.max(s.longestStreak, s.currentStreak);
  } else {
    s.losses += 1;
    s.currentStreak = 0;
  }
  save(s);
  return s;
}

export function recordUnoCall() {
  const s = getStats();
  s.unoCalls += 1;
  save(s);
}

export function recordDrawFour() {
  const s = getStats();
  s.drawFours += 1;
  save(s);
}

export function winRate(s: PlayerStats): string {
  return s.gamesPlayed ? `${((s.wins / s.gamesPlayed) * 100).toFixed(1)}%` : "0%";
}

// ---- Match history ----
export interface MatchRecord { result: "WIN" | "LOSE"; players: string; count: number; at: number; }
const HKEY = "uno_history";

export function getMatchHistory(): MatchRecord[] {
  try { return JSON.parse(localStorage.getItem(HKEY) || "[]"); } catch { return []; }
}

export function recordMatchHistory(rec: MatchRecord) {
  const h = [rec, ...getMatchHistory()].slice(0, 25);
  try { localStorage.setItem(HKEY, JSON.stringify(h)); } catch { /* ignore */ }
}

export function timeAgo(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
