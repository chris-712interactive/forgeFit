"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseCountdownOptions {
  seconds: number;
  onComplete: () => void;
}

export function useCountdown({ seconds, onComplete }: UseCountdownOptions) {
  const [remaining, setRemaining] = useState(seconds);
  const [paused, setPaused] = useState(false);
  const completed = useRef(false);

  useEffect(() => {
    setRemaining(seconds);
    setPaused(false);
    completed.current = false;
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      if (!completed.current) {
        completed.current = true;
        onComplete();
      }
      return;
    }

    if (paused) return;

    const timer = window.setInterval(() => {
      setRemaining((prev) => prev - 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [remaining, onComplete, paused]);

  const togglePause = useCallback(() => {
    setPaused((current) => !current);
  }, []);

  return {
    remaining,
    paused,
    elapsed: Math.max(0, seconds - remaining),
    progress: seconds > 0 ? Math.max(0, (remaining / seconds) * 100) : 0,
    togglePause,
  };
}
