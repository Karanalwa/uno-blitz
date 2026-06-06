import { useCallback, useRef } from "react";

// Web Audio API sound synthesis
function createAudioContext(): AudioContext | null {
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch {
    return null;
  }
}

function playTone(ctx: AudioContext, frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.3) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);

  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playNoise(ctx: AudioContext, duration: number, volume = 0.1) {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = createAudioContext();
    }
    if (ctxRef.current?.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const playCard = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    // Satisfying "snap" sound
    playTone(ctx, 800, 0.05, "square", 0.15);
    setTimeout(() => playTone(ctx, 600, 0.08, "sine", 0.2), 30);
    setTimeout(() => playNoise(ctx, 0.05, 0.08), 50);
  }, [getCtx]);

  const playDraw = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    // Swoosh sound
    playTone(ctx, 400, 0.15, "sine", 0.1);
    setTimeout(() => playTone(ctx, 600, 0.1, "sine", 0.08), 50);
    setTimeout(() => playTone(ctx, 500, 0.12, "triangle", 0.1), 100);
  }, [getCtx]);

  const playUno = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    // Triumphant chime
    playTone(ctx, 523, 0.15, "sine", 0.25); // C5
    setTimeout(() => playTone(ctx, 659, 0.15, "sine", 0.25), 100); // E5
    setTimeout(() => playTone(ctx, 784, 0.2, "sine", 0.3), 200); // G5
    setTimeout(() => playTone(ctx, 1047, 0.3, "sine", 0.25), 350); // C6
  }, [getCtx]);

  const playSkip = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    playTone(ctx, 440, 0.1, "square", 0.15);
    setTimeout(() => playTone(ctx, 220, 0.2, "sawtooth", 0.1), 80);
  }, [getCtx]);

  const playReverse = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    for (let i = 0; i < 5; i++) {
      setTimeout(() => playTone(ctx, 500 + i * 100, 0.08, "sine", 0.1), i * 40);
    }
  }, [getCtx]);

  const playWild = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    // Magical sparkle
    const notes = [523, 659, 784, 1047, 784, 659, 523];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(ctx, freq, 0.1, "sine", 0.15), i * 60);
    });
  }, [getCtx]);

  const playDraw2 = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    playTone(ctx, 300, 0.15, "square", 0.15);
    setTimeout(() => playTone(ctx, 300, 0.15, "square", 0.15), 150);
  }, [getCtx]);

  const playError = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    playTone(ctx, 200, 0.2, "square", 0.15);
    setTimeout(() => playTone(ctx, 150, 0.3, "sawtooth", 0.1), 100);
  }, [getCtx]);

  const playWin = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const melody = [523, 587, 659, 784, 659, 784, 1047];
    melody.forEach((freq, i) => {
      setTimeout(() => playTone(ctx, freq, 0.2, "sine", 0.2), i * 120);
    });
  }, [getCtx]);

  const playButton = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    playTone(ctx, 900, 0.05, "sine", 0.1);
  }, [getCtx]);

  const playShuffle = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    // Rapid riffle of paper ticks
    for (let i = 0; i < 8; i++) {
      setTimeout(() => playNoise(ctx, 0.04, 0.06), i * 45);
    }
  }, [getCtx]);

  // Alias so callers can use a clear "victory" name (maps to the win fanfare).
  const playVictory = playWin;

  return {
    playCard,
    playDraw,
    playUno,
    playSkip,
    playReverse,
    playWild,
    playDraw2,
    playError,
    playWin,
    playVictory,
    playShuffle,
    playButton,
  };
}
