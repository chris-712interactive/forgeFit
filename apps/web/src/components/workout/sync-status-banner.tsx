"use client";

import { useWorkoutSyncContext } from "./sync-manager";

export function SyncStatusBanner() {
  const sync = useWorkoutSyncContext();
  if (!sync) return null;

  const { pendingCount, syncing, lastError, runSync } = sync;

  if (lastError) {
    return (
      <div className="mx-4 mb-4 rounded-xl border border-forge-coral/40 bg-forge-coral/10 p-3 text-sm">
        <p className="font-medium text-forge-coral">Sync failed</p>
        <p className="mt-1 text-forge-muted">{lastError}</p>
        <button
          type="button"
          onClick={() => void runSync()}
          className="mt-2 font-semibold text-forge-ember"
        >
          Retry sync
        </button>
      </div>
    );
  }

  if (syncing) {
    return (
      <p className="mx-4 mb-4 text-sm text-forge-steel">Syncing workout data…</p>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className="mx-4 mb-4 rounded-xl border border-forge-gold/30 bg-forge-gold/10 p-3 text-sm">
        <p className="text-forge-gold">
          {pendingCount} item{pendingCount === 1 ? "" : "s"} waiting to sync
        </p>
        <button
          type="button"
          onClick={() => void runSync()}
          className="mt-1 font-semibold text-forge-ember"
        >
          Sync now
        </button>
      </div>
    );
  }

  return null;
}
