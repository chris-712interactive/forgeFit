"use client";

import { useEffect, useState } from "react";

interface RestTimerProps {
  seconds: number;
  onComplete: () => void;
  onSkip: () => void;
}

export function RestTimer({ seconds, onComplete, onSkip }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      onComplete();
      return;
    }

    const timer = window.setInterval(() => {
      setRemaining((prev) => prev - 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [remaining, onComplete]);

  const progress = Math.max(0, (remaining / seconds) * 100);

  return (
    <div className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 px-4">
      <div className="rest-timer-pulse mx-auto max-w-lg rounded-2xl border border-forge-gold/40 bg-forge-surface-raised p-4 shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-forge-gold">
              Rest
            </p>
            <p className="font-display text-3xl font-bold text-forge-gold">
              {formatTime(remaining)}
            </p>
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-forge-muted"
          >
            Skip
          </button>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-forge-surface">
          <div
            className="h-full rounded-full bg-forge-gold transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function formatTime(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
