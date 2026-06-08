import { useSyncExternalStore } from "react";

export interface Wallet { coins: number; gems: number; xp: number; }

const KEY = "uno_wallet";
const DEFAULT: Wallet = { coins: 1000, gems: 50, xp: 0 };

let cache: Wallet | null = null;
const listeners = new Set<() => void>();

export function getWallet(): Wallet {
  if (!cache) {
    try { cache = { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; }
    catch { cache = { ...DEFAULT }; }
  }
  return cache;
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

export function addCoins(n: number) { cache = { ...getWallet(), coins: Math.max(0, getWallet().coins + n) }; save(); }
export function addGems(n: number) { cache = { ...getWallet(), gems: Math.max(0, getWallet().gems + n) }; save(); }
export function addXp(n: number) { cache = { ...getWallet(), xp: Math.max(0, getWallet().xp + n) }; save(); }

/** Derive level + progress from total XP (each level costs a bit more). */
export interface LevelInfo { level: number; into: number; need: number; total: number; }
export function levelInfo(xp: number): LevelInfo {
  let level = 1;
  let remaining = xp;
  let need = 400; // XP for level 1 → 2
  while (remaining >= need) {
    remaining -= need;
    level += 1;
    need = 400 + (level - 1) * 200;
  }
  return { level, into: remaining, need, total: xp };
}

function subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); }
export function useWallet(): Wallet { return useSyncExternalStore(subscribe, getWallet, getWallet); }
