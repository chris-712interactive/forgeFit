"use client";

import { formatTimerSeconds } from "./timer-utils";
import { useCountdown, type CountdownCompleteMeta, type CountdownPersistState, type CountdownRestoreState } from "./use-countdown";

interface RestTimerProps {
  seconds: number;
  onComplete: (meta?: CountdownCompleteMeta) => void;
  onSkip: () => void;
  restore?: CountdownRestoreState | null;
  onPersist?: (state: CountdownPersistState | null) => void;
}

export function RestTimer({
  seconds,
  onComplete,
  onSkip,
  restore,
  onPersist,
}: RestTimerProps) {
  const { remaining, paused, progress, togglePause } = useCountdown({
    seconds,
    onComplete,
    restore,
    onPersist,
  });

  return (
    <div className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 px-4">
      <div
        className={`mx-auto max-w-lg rounded-2xl border border-forge-gold/40 bg-forge-surface-raised p-4 shadow-lg ${
          paused ? "" : "rest-timer-pulse"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-forge-gold">
              Rest
              {paused && (
                <span className="ml-2 normal-case text-forge-muted">· Paused</span>
              )}
            </p>
            <p className="font-display text-3xl font-bold text-forge-gold">
              {formatTimerSeconds(remaining)}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={togglePause}
              className="rounded-xl border border-forge-gold/30 bg-forge-gold/10 px-4 py-2 text-sm font-medium text-forge-gold"
            >
              {paused ? "Resume" : "Pause"}
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-forge-muted"
            >
              Skip
            </button>
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-forge-surface">
          <div
            className={`h-full rounded-full bg-forge-gold ${
              paused ? "" : "transition-all duration-1000 ease-linear"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
