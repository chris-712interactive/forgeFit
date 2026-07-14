import { playTimerCompleteSound } from "@/lib/audio/timer-sounds";

export function vibrateTimerComplete(): void {
  try {
    navigator.vibrate?.([120, 60, 120]);
  } catch {
    // Unsupported or denied — ignore.
  }
}

export function feedbackTimerComplete(options?: {
  playSound?: boolean;
  vibrate?: boolean;
}): void {
  if (options?.vibrate !== false) {
    vibrateTimerComplete();
  }
  if (options?.playSound) {
    playTimerCompleteSound();
  }
}
