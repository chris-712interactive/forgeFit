"use client";

import { useWorkoutSync } from "@/hooks/use-workout-sync";
import { createContext, useContext, type ReactNode } from "react";

interface SyncContextValue {
  pendingCount: number;
  syncing: boolean;
  lastError: string | null;
  lastSyncedAt: Date | null;
  runSync: () => Promise<unknown>;
  refreshPending: () => Promise<number>;
}

const WorkoutSyncContext = createContext<SyncContextValue | null>(null);

export function useWorkoutSyncContext() {
  return useContext(WorkoutSyncContext);
}

export function SyncManager({
  userId,
  children,
}: {
  userId: string;
  children?: ReactNode;
}) {
  const sync = useWorkoutSync(userId);

  return (
    <WorkoutSyncContext.Provider value={sync}>
      {children}
    </WorkoutSyncContext.Provider>
  );
}
