import { useSyncExternalStore } from "react";

export interface Settings {
  // Audio
  sfxVolume: number; // 0-100
  musicVolume: number; // 0-100
  announcer: boolean;
  muteAll: boolean;
  // Graphics
  cardAnimation: boolean;
  particles: boolean;
  backgroundFx: boolean;
  reducedMotion: boolean;
  // Controls
  vibration: boolean;
  quickPlay: boolean;
  confirmPlay: boolean;
  leftHanded: boolean;
  // General
  tutorialHints: boolean;
  showTimer: boolean;
  autoReady: boolean;
  // Language
  language: string;
}

const KEY = "uno_settings";
const DEFAULT: Settings = {
  sfxVolume: 80,
  musicVolume: 60,
  announcer: true,
  muteAll: false,
  cardAnimation: true,
  particles: true,
  backgroundFx: true,
  reducedMotion: false,
  vibration: true,
  quickPlay: false,
  confirmPlay: false,
  leftHanded: false,
  tutorialHints: true,
  showTimer: true,
  autoReady: false,
  language: "English",
};

let cache: Settings | null = null;
const listeners = new Set<() => void>();

export function getSettings(): Settings {
  if (!cache) {
    try {
      cache = { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
    } catch {
      cache = { ...DEFAULT };
    }
  }
  return cache;
}

export function setSettings(patch: Partial<Settings>) {
  cache = { ...getSettings(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Reactive hook — re-renders when settings change anywhere in the app. */
export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings, getSettings);
}

/** Trigger device vibration if enabled (no-op on unsupported devices). */
export function vibrate(ms: number) {
  if (getSettings().vibration && typeof navigator !== "undefined" && "vibrate" in navigator) {
    try { navigator.vibrate(ms); } catch { /* ignore */ }
  }
}
