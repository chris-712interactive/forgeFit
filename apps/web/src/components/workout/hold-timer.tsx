"use client";

import { playTimerCompleteSound, playTimerStartSound } from "@/lib/audio/timer-sounds";
import { useEffect, useRef, useState } from "react";
import { formatTimerSeconds } from "./timer-utils";

interface HoldTimerProps {
  seconds: number;
  onComplete: () => void;
  onSkip: () => void;
}

export function HoldTimer({ seconds, onComplete, onSkip }: HoldTimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const startedSound = useRef(false);
  const completed = useRef(false);

  useEffect(() => {
    setRemaining(seconds);
    startedSound.current = false;
    completed.current = false;
  }, [seconds]);

  useEffect(() => {
    if (!startedSound.current) {
      playTimerStartSound();
      startedSound.current = true;
    }
  }, []);

  useEffect(() => {
    if (remaining <= 0) {
      if (!completed.current) {
        completed.current = true;
        playTimerCompleteSound();
        onComplete();
      }
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
      <div className="hold-timer-pulse mx-auto max-w-lg rounded-2xl border border-forge-ember/40 bg-forge-surface-raised p-4 shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-forge-ember">
              Hold
            </p>
            <p className="font-display text-3xl font-bold text-forge-ember">
              {formatTimerSeconds(remaining)}
            </p>
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-forge-muted"
          >
            Stop
          </button>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-forge-surface">
          <div
            className="h-full rounded-full bg-forge-ember transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
