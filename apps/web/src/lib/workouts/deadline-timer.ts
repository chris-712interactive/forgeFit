export interface CountdownRestoreState {
  endsAtMs: number;
  paused: boolean;
  pausedRemainingMs?: number;
}

export interface CountdownPersistState {
  totalSeconds: number;
  endsAtMs: number;
  paused: boolean;
  pausedRemainingMs?: number;
}

export interface CountdownCompleteMeta {
  resumedFromBackground?: boolean;
}

export function remainingMsFromDeadline(
  state: Pick<CountdownRestoreState, "endsAtMs" | "paused" | "pausedRemainingMs">,
  now = Date.now()
): number {
  if (state.paused && state.pausedRemainingMs != null) {
    return Math.max(0, state.pausedRemainingMs);
  }
  return Math.max(0, state.endsAtMs - now);
}

export function remainingSecondsFromDeadline(
  state: Pick<CountdownRestoreState, "endsAtMs" | "paused" | "pausedRemainingMs">,
  now = Date.now()
): number {
  return Math.ceil(remainingMsFromDeadline(state, now) / 1000);
}

export function elapsedSecondsFromTotal(
  totalSeconds: number,
  state: Pick<CountdownRestoreState, "endsAtMs" | "paused" | "pausedRemainingMs">,
  now = Date.now()
): number {
  const remaining = remainingSecondsFromDeadline(state, now);
  return Math.min(totalSeconds, Math.max(0, totalSeconds - remaining));
}

export function progressPercent(
  totalSeconds: number,
  state: Pick<CountdownRestoreState, "endsAtMs" | "paused" | "pausedRemainingMs">,
  now = Date.now()
): number {
  if (totalSeconds <= 0) return 0;
  const remaining = remainingSecondsFromDeadline(state, now);
  return Math.max(0, Math.min(100, (remaining / totalSeconds) * 100));
}

export function isDeadlineExpired(
  state: Pick<CountdownRestoreState, "endsAtMs" | "paused" | "pausedRemainingMs">,
  now = Date.now()
): boolean {
  return !state.paused && remainingMsFromDeadline(state, now) <= 0;
}
