let sharedContext: AudioContext | null = null;

/** Resume / create AudioContext — call from a user gesture (Start intervals). */
export function unlockTimerAudio(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  void ctx.resume();
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedContext) {
    sharedContext = new AudioContext();
  }
  void sharedContext.resume();
  return sharedContext;
}

type ToneOptions = {
  frequency: number;
  durationSec: number;
  startOffsetSec?: number;
  type?: OscillatorType;
  peakGain?: number;
};

function playTone(ctx: AudioContext, options: ToneOptions): void {
  const {
    frequency,
    durationSec,
    startOffsetSec = 0,
    type = "sine",
    peakGain = 0.28,
  } = options;
  const start = ctx.currentTime + startOffsetSec;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peakGain, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + durationSec);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + durationSec + 0.05);
}

/** Short rising cue when a timed hold begins. */
export function playTimerStartSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, { frequency: 520, durationSec: 0.1 });
  playTone(ctx, { frequency: 780, durationSec: 0.12, startOffsetSec: 0.11 });
}

/** Two-tone cue when a timed hold finishes. */
export function playTimerCompleteSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, { frequency: 660, durationSec: 0.18 });
  playTone(ctx, { frequency: 880, durationSec: 0.22, startOffsetSec: 0.2 });
}

const GYM_PEAK = 0.85;

/** Loud GO cue — work phase starts. */
export function playIntervalWorkSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, {
    frequency: 880,
    durationSec: 0.22,
    type: "square",
    peakGain: GYM_PEAK,
  });
  playTone(ctx, {
    frequency: 1175,
    durationSec: 0.28,
    startOffsetSec: 0.18,
    type: "square",
    peakGain: GYM_PEAK,
  });
  playTone(ctx, {
    frequency: 1319,
    durationSec: 0.35,
    startOffsetSec: 0.4,
    type: "sawtooth",
    peakGain: 0.55,
  });
}

/** Loud STOP / recover cue — rest or between-exercise starts. */
export function playIntervalRestSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, {
    frequency: 440,
    durationSec: 0.35,
    type: "square",
    peakGain: GYM_PEAK,
  });
  playTone(ctx, {
    frequency: 330,
    durationSec: 0.45,
    startOffsetSec: 0.28,
    type: "square",
    peakGain: GYM_PEAK,
  });
}

/** Final block / protocol complete. */
export function playIntervalCompleteSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, {
    frequency: 523,
    durationSec: 0.2,
    type: "square",
    peakGain: GYM_PEAK,
  });
  playTone(ctx, {
    frequency: 659,
    durationSec: 0.2,
    startOffsetSec: 0.18,
    type: "square",
    peakGain: GYM_PEAK,
  });
  playTone(ctx, {
    frequency: 784,
    durationSec: 0.45,
    startOffsetSec: 0.36,
    type: "sawtooth",
    peakGain: GYM_PEAK,
  });
}

/** Single countdown tick (last 3 seconds). */
export function playIntervalCountdownTick(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, {
    frequency: 990,
    durationSec: 0.08,
    type: "square",
    peakGain: 0.7,
  });
}
