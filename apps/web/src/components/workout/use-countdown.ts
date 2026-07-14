"use client";

import {
  elapsedSecondsFromTotal,
  isDeadlineExpired,
  progressPercent,
  remainingMsFromDeadline,
  remainingSecondsFromDeadline,
  type CountdownCompleteMeta,
  type CountdownPersistState,
  type CountdownRestoreState,
} from "@/lib/workouts/deadline-timer";
import { useCallback, useEffect, useRef, useState } from "react";

export type {
  CountdownCompleteMeta,
  CountdownPersistState,
  CountdownRestoreState,
};

interface UseCountdownOptions {
  seconds: number;
  onComplete: (meta?: CountdownCompleteMeta) => void;
  restore?: CountdownRestoreState | null;
  onPersist?: (state: CountdownPersistState | null) => void;
}

function buildInitialDeadline(
  seconds: number,
  restore?: CountdownRestoreState | null
): CountdownRestoreState {
  if (restore) {
    return restore;
  }
  return {
    endsAtMs: Date.now() + seconds * 1000,
    paused: false,
  };
}

export function useCountdown({
  seconds,
  onComplete,
  restore,
  onPersist,
}: UseCountdownOptions) {
  const totalSeconds = Math.max(0, seconds);
  const [deadline, setDeadline] = useState<CountdownRestoreState>(() =>
    buildInitialDeadline(totalSeconds, restore)
  );
  const [remaining, setRemaining] = useState(() =>
    remainingSecondsFromDeadline(buildInitialDeadline(totalSeconds, restore))
  );
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onPersistRef = useRef(onPersist);
  const wasHiddenRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onPersistRef.current = onPersist;
  }, [onPersist]);

  const complete = useCallback((meta?: CountdownCompleteMeta) => {
    if (completedRef.current) return;
    completedRef.current = true;
    onPersistRef.current?.(null);
    onCompleteRef.current(meta);
  }, []);

  const syncDisplay = useCallback(
    (now = Date.now(), meta?: CountdownCompleteMeta) => {
      if (completedRef.current) return;

      if (isDeadlineExpired(deadline, now)) {
        setRemaining(0);
        complete(meta);
        return;
      }

      setRemaining(remainingSecondsFromDeadline(deadline, now));
    },
    [complete, deadline]
  );

  const emitPersist = useCallback(
    (next: CountdownRestoreState) => {
      if (completedRef.current) {
        onPersistRef.current?.(null);
        return;
      }
      onPersistRef.current?.({
        totalSeconds,
        endsAtMs: next.endsAtMs,
        paused: next.paused,
        pausedRemainingMs: next.pausedRemainingMs,
      });
    },
    [totalSeconds]
  );

  useEffect(() => {
    completedRef.current = false;
    const initial = buildInitialDeadline(totalSeconds, restore);
    setDeadline(initial);
    const now = Date.now();

    if (isDeadlineExpired(initial, now)) {
      setRemaining(0);
      complete({ resumedFromBackground: Boolean(restore) });
      return;
    }

    setRemaining(remainingSecondsFromDeadline(initial, now));
    emitPersist(initial);
  }, [totalSeconds, restore, complete, emitPersist]);

  useEffect(() => {
    if (completedRef.current || deadline.paused) return;

    const interval = window.setInterval(() => {
      syncDisplay();
    }, 250);

    return () => window.clearInterval(interval);
  }, [deadline.paused, syncDisplay]);

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "hidden") {
        wasHiddenRef.current = true;
        return;
      }

      if (document.visibilityState !== "visible") return;

      const resumedFromBackground = wasHiddenRef.current;
      wasHiddenRef.current = false;
      syncDisplay(
        Date.now(),
        resumedFromBackground ? { resumedFromBackground: true } : undefined
      );
    }

    function handleResume() {
      const resumedFromBackground = wasHiddenRef.current;
      wasHiddenRef.current = false;
      syncDisplay(
        Date.now(),
        resumedFromBackground ? { resumedFromBackground: true } : undefined
      );
    }

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleResume);
    window.addEventListener("pageshow", handleResume);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleResume);
      window.removeEventListener("pageshow", handleResume);
    };
  }, [syncDisplay]);

  const togglePause = useCallback(() => {
    if (completedRef.current) return;

    setDeadline((current) => {
      const now = Date.now();
      if (!current.paused) {
        const pausedRemainingMs = remainingMsFromDeadline(current, now);
        const next: CountdownRestoreState = {
          endsAtMs: current.endsAtMs,
          paused: true,
          pausedRemainingMs,
        };
        setRemaining(remainingSecondsFromDeadline(next, now));
        emitPersist(next);
        return next;
      }

      const resumeMs = current.pausedRemainingMs ?? 0;
      const next: CountdownRestoreState = {
        endsAtMs: now + resumeMs,
        paused: false,
      };
      setRemaining(remainingSecondsFromDeadline(next, now));
      emitPersist(next);
      return next;
    });
  }, [emitPersist]);

  const elapsed = elapsedSecondsFromTotal(totalSeconds, deadline);
  const progress = progressPercent(totalSeconds, deadline);

  return {
    remaining,
    paused: deadline.paused,
    elapsed,
    progress,
    togglePause,
  };
}
