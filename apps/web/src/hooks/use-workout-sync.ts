"use client";

import {
  getPendingSyncCount,
  syncWorkoutData,
  type SyncOutcome,
} from "@forgefit/offline-sync";
import { useCallback, useEffect, useRef, useState } from "react";

export function useWorkoutSync(userId: string) {
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const syncingRef = useRef(false);

  const refreshPending = useCallback(async () => {
    const count = await getPendingSyncCount(userId);
    setPendingCount(count);
    return count;
  }, [userId]);

  const runSync = useCallback(async (): Promise<SyncOutcome> => {
    if (syncingRef.current || !navigator.onLine) return null;
    syncingRef.current = true;
    setSyncing(true);
    setLastError(null);

    try {
      const result = await syncWorkoutData(userId);
      if (result && "ok" in result && result.ok) {
        setLastSyncedAt(new Date());
        setLastError(null);
      } else if (result && "ok" in result && !result.ok) {
        setLastError(result.message);
      }
      await refreshPending();
      return result;
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [refreshPending, userId]);

  useEffect(() => {
    void refreshPending();
  }, [refreshPending]);

  useEffect(() => {
    function scheduleSync() {
      if (!navigator.onLine) return;
      void runSync();
    }

    scheduleSync();

    window.addEventListener("online", scheduleSync);
    window.addEventListener("focus", scheduleSync);
    window.addEventListener("pageshow", scheduleSync);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") scheduleSync();
    });

    const interval = window.setInterval(async () => {
      const pending = await refreshPending();
      if (pending > 0 && navigator.onLine) {
        void runSync();
      }
    }, 15000);

    return () => {
      window.removeEventListener("online", scheduleSync);
      window.removeEventListener("focus", scheduleSync);
      window.removeEventListener("pageshow", scheduleSync);
      window.clearInterval(interval);
    };
  }, [refreshPending, runSync]);

  return {
    pendingCount,
    syncing,
    lastError,
    lastSyncedAt,
    runSync,
    refreshPending,
  };
}
