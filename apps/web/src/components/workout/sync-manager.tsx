"use client";

import { syncWorkoutData } from "@forgefit/offline-sync";
import { useEffect } from "react";

interface SyncManagerProps {
  userId: string;
}

export function SyncManager({ userId }: SyncManagerProps) {
  useEffect(() => {
    async function runSync() {
      if (!navigator.onLine) return;
      try {
        await syncWorkoutData(userId);
      } catch {
        // Retry on next online event.
      }
    }

    void runSync();

    function handleOnline() {
      void runSync();
    }

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [userId]);

  return null;
}
