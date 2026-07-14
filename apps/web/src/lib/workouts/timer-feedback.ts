import {
  playIntervalCompleteSound,
  playIntervalRestSound,
  playIntervalWorkSound,
  playTimerCompleteSound,
} from "@/lib/audio/timer-sounds";

export function vibrateTimerComplete(): void {
  try {
    navigator.vibrate?.([120, 60, 120]);
  } catch {
    // Unsupported or denied — ignore.
  }
}

export function vibrateIntervalWork(): void {
  try {
    navigator.vibrate?.([220, 80, 220]);
  } catch {
    // Unsupported or denied — ignore.
  }
}

export function vibrateIntervalRest(): void {
  try {
    navigator.vibrate?.([80, 50, 80, 50, 80]);
  } catch {
    // Unsupported or denied — ignore.
  }
}

export function vibrateIntervalComplete(): void {
  try {
    navigator.vibrate?.([160, 70, 160, 70, 280]);
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

export function feedbackIntervalPhase(
  kind: "work" | "rest" | "complete",
  options?: { playSound?: boolean; vibrate?: boolean }
): void {
  const playSound = options?.playSound !== false;
  const vibrate = options?.vibrate !== false;

  if (kind === "work") {
    if (vibrate) vibrateIntervalWork();
    if (playSound) playIntervalWorkSound();
    return;
  }
  if (kind === "rest") {
    if (vibrate) vibrateIntervalRest();
    if (playSound) playIntervalRestSound();
    return;
  }
  if (vibrate) vibrateIntervalComplete();
  if (playSound) playIntervalCompleteSound();
}
