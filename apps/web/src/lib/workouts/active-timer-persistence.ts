import type { CountdownPersistState, CountdownRestoreState } from "./deadline-timer";

export type ActiveTimerKind =
  | "rest"
  | "hold"
  | "warmup"
  | "recovery"
  | "interval";

export interface PersistedActiveTimer extends CountdownPersistState {
  sessionClientId: string;
  kind: ActiveTimerKind;
  setClientId?: string;
  exerciseId?: string;
  label?: string;
  /** Interval protocol run pointer (JSON-serializable). */
  intervalPhase?: string;
  intervalRoundIndex?: number;
  intervalBlockIndex?: number;
  intervalSeconds?: number;
  /** Workout step index when the timer was saved (for resume after navigation). */
  workoutStepIndex?: number;
}

const STORAGE_KEY = "forgerep:active-timer";

function readStore(): Record<string, PersistedActiveTimer> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, PersistedActiveTimer>;
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, PersistedActiveTimer>): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Quota or private mode — ignore.
  }
}

export function savePersistedActiveTimer(timer: PersistedActiveTimer): void {
  const store = readStore();
  store[timer.sessionClientId] = timer;
  writeStore(store);
}

export function loadPersistedActiveTimer(
  sessionClientId: string
): PersistedActiveTimer | null {
  return readStore()[sessionClientId] ?? null;
}

export function clearPersistedActiveTimer(sessionClientId: string): void {
  const store = readStore();
  if (!store[sessionClientId]) return;
  delete store[sessionClientId];
  writeStore(store);
}

export function toCountdownRestore(
  timer: PersistedActiveTimer
): CountdownRestoreState {
  return {
    endsAtMs: timer.endsAtMs,
    paused: timer.paused,
    pausedRemainingMs: timer.pausedRemainingMs,
  };
}
