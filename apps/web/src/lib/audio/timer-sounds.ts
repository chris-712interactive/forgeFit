let sharedContext: AudioContext | null = null;
let unlockPromise: Promise<boolean> | null = null;

function getOrCreateContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedContext) {
    sharedContext = new AudioCtx();
  }
  return sharedContext;
}

/**
 * Unlock Web Audio during a user gesture (required on iOS Safari / installed PWA).
 * Plays a silent buffer so the context stays allowed for later interval cues.
 */
export async function unlockTimerAudio(): Promise<boolean> {
  if (unlockPromise) return unlockPromise;

  unlockPromise = (async () => {
    const ctx = getOrCreateContext();
    if (!ctx) return false;
    try {
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      // 1-sample silent buffer — marks this context as user-activated on iOS.
      const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      return ctx.state === "running";
    } catch {
      return false;
    } finally {
      // Allow a fresh unlock attempt if the context suspends later.
      window.setTimeout(() => {
        unlockPromise = null;
      }, 0);
    }
  })();

  return unlockPromise;
}

async function ensureRunningContext(): Promise<AudioContext | null> {
  const ctx = getOrCreateContext();
  if (!ctx) return null;
  try {
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    if (ctx.state !== "running") {
      await unlockTimerAudio();
    }
    return ctx.state === "running" ? ctx : ctx;
  } catch {
    return ctx;
  }
}

type ToneOptions = {
  frequency: number;
  durationSec: number;
  startOffsetSec?: number;
  type?: OscillatorType;
  peakGain?: number;
};

function scheduleTone(ctx: AudioContext, options: ToneOptions): void {
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

  // linearRamp is more reliable than exponentialRamp near near-zero values.
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(peakGain, start + 0.02);
  gain.gain.linearRampToValueAtTime(0.0001, start + Math.max(durationSec, 0.05));

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + durationSec + 0.08);
}

async function playTones(tones: ToneOptions[]): Promise<void> {
  const ctx = await ensureRunningContext();
  if (!ctx) return;
  try {
    for (const tone of tones) {
      scheduleTone(ctx, tone);
    }
  } catch {
    // Autoplay / AudioContext errors — ignore; vibrate still works.
  }
}

/** Short rising cue when a timed hold begins. */
export function playTimerStartSound(): void {
  void playTones([
    { frequency: 520, durationSec: 0.1 },
    { frequency: 780, durationSec: 0.12, startOffsetSec: 0.11 },
  ]);
}

/** Two-tone cue when a timed hold finishes. */
export function playTimerCompleteSound(): void {
  void playTones([
    { frequency: 660, durationSec: 0.18 },
    { frequency: 880, durationSec: 0.22, startOffsetSec: 0.2 },
  ]);
}

const GYM_PEAK = 0.75;

/** Loud GO cue — work phase starts. */
export function playIntervalWorkSound(): void {
  void playIntervalPhaseCue("work");
}

/** Loud STOP / recover cue — rest or between-exercise starts. */
export function playIntervalRestSound(): void {
  void playIntervalPhaseCue("rest");
}

/** Final block / protocol complete. */
export function playIntervalCompleteSound(): void {
  void playIntervalPhaseCue("complete");
}

/** Single countdown tick (last 3 seconds). */
export function playIntervalCountdownTick(): void {
  void playTones([
    { frequency: 990, durationSec: 0.09, type: "square", peakGain: 0.65 },
  ]);
}

/** Play the correct phase cue after ensuring the context is running. */
export async function playIntervalPhaseCue(
  kind: "work" | "rest" | "complete"
): Promise<void> {
  await unlockTimerAudio();
  if (kind === "work") {
    await playTones([
      { frequency: 880, durationSec: 0.25, type: "square", peakGain: GYM_PEAK },
      {
        frequency: 1175,
        durationSec: 0.3,
        startOffsetSec: 0.2,
        type: "square",
        peakGain: GYM_PEAK,
      },
      {
        frequency: 1319,
        durationSec: 0.4,
        startOffsetSec: 0.42,
        type: "triangle",
        peakGain: 0.55,
      },
    ]);
    return;
  }
  if (kind === "rest") {
    await playTones([
      { frequency: 440, durationSec: 0.4, type: "square", peakGain: GYM_PEAK },
      {
        frequency: 330,
        durationSec: 0.5,
        startOffsetSec: 0.3,
        type: "square",
        peakGain: GYM_PEAK,
      },
    ]);
    return;
  }
  await playTones([
    { frequency: 523, durationSec: 0.22, type: "square", peakGain: GYM_PEAK },
    {
      frequency: 659,
      durationSec: 0.22,
      startOffsetSec: 0.2,
      type: "square",
      peakGain: GYM_PEAK,
    },
    {
      frequency: 784,
      durationSec: 0.5,
      startOffsetSec: 0.4,
      type: "triangle",
      peakGain: GYM_PEAK,
    },
  ]);
}
