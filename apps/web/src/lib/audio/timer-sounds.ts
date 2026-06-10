let sharedContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedContext) {
    sharedContext = new AudioContext();
  }
  void sharedContext.resume();
  return sharedContext;
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  durationSec: number,
  startOffsetSec = 0
): void {
  const start = ctx.currentTime + startOffsetSec;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.28, start + 0.02);
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
  playTone(ctx, 520, 0.1);
  playTone(ctx, 780, 0.12, 0.11);
}

/** Two-tone cue when a timed hold finishes. */
export function playTimerCompleteSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, 660, 0.18);
  playTone(ctx, 880, 0.22, 0.2);
}
