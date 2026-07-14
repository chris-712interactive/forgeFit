"use client";

import { useEffect, useRef } from "react";

/**
 * Keeps the screen awake while a workout timer is running.
 * Re-acquires after visibility returns (OS releases wake lock when hidden).
 */
export function useScreenWakeLock(active: boolean): void {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active) {
      void lockRef.current?.release();
      lockRef.current = null;
      return;
    }

    let cancelled = false;

    async function acquire() {
      if (!navigator.wakeLock?.request) return;
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (cancelled) {
          await lock.release();
          return;
        }
        lockRef.current = lock;
        lock.addEventListener("release", () => {
          if (lockRef.current === lock) {
            lockRef.current = null;
          }
        });
      } catch {
        // Permission denied or unsupported — no-op.
      }
    }

    void acquire();

    function handleVisibility() {
      if (document.visibilityState === "visible" && active) {
        void acquire();
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      void lockRef.current?.release();
      lockRef.current = null;
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [active]);
}
