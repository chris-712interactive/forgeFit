"use client";

import { playTimerCompleteSound, playTimerStartSound } from "@/lib/audio/timer-sounds";
import { useEffect, useRef } from "react";
import { formatTimerSeconds } from "./timer-utils";
import { useCountdown } from "./use-countdown";

interface HoldTimerProps {
  seconds: number;
  label?: string;
  onComplete: () => void;
  onStop: (elapsedSeconds: number) => void;
}

export function HoldTimer({
  seconds,
  label = "Hold",
  onComplete,
  onStop,
}: HoldTimerProps) {
  const startedSound = useRef(false);
  const completedSound = useRef(false);

  const handleComplete = () => {
    if (!completedSound.current) {
      completedSound.current = true;
      playTimerCompleteSound();
    }
    onComplete();
  };

  const { remaining, paused, elapsed, progress, togglePause } = useCountdown({
    seconds,
    onComplete: handleComplete,
  });

  useEffect(() => {
    startedSound.current = false;
    completedSound.current = false;
  }, [seconds]);

  useEffect(() => {
    if (!startedSound.current) {
      playTimerStartSound();
      startedSound.current = true;
    }
  }, []);

  return (
    <div className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 px-4">
      <div
        className={`mx-auto max-w-lg rounded-2xl border border-forge-ember/40 bg-forge-surface-raised p-4 shadow-lg ${
          paused ? "" : "hold-timer-pulse"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-forge-ember">
              {label}
              {paused && (
                <span className="ml-2 normal-case text-forge-muted">· Paused</span>
              )}
            </p>
            <p className="font-display text-3xl font-bold text-forge-ember">
              {formatTimerSeconds(remaining)}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={togglePause}
              className="rounded-xl border border-forge-ember/30 bg-forge-ember/10 px-4 py-2 text-sm font-medium text-forge-ember"
            >
              {paused ? "Resume" : "Pause"}
            </button>
            <button
              type="button"
              onClick={() => onStop(elapsed)}
              className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-forge-muted"
            >
              Stop
            </button>
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-forge-surface">
          <div
            className={`h-full rounded-full bg-forge-ember ${
              paused ? "" : "transition-all duration-1000 ease-linear"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
