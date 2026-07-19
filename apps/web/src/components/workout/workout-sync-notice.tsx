"use client";

import { FEATURE_SYNC_TEMPORARILY_LIMITED } from "@/lib/ui/member-errors";
import { useWorkoutSyncContext } from "./sync-manager";

interface WorkoutSyncNoticeProps {
  workoutsTableReady: boolean;
  syncedToAccount: boolean;
  compact?: boolean;
}

export function WorkoutSyncNotice({
  workoutsTableReady,
  syncedToAccount,
  compact = false,
}: WorkoutSyncNoticeProps) {
  const sync = useWorkoutSyncContext();

  if (!workoutsTableReady) {
    return (
      <div
        className={`rounded-xl border border-forge-coral/40 bg-forge-coral/10 text-sm ${
          compact ? "mt-3 p-3" : "p-3 sm:p-4"
        }`}
      >
        <p className="font-medium text-forge-coral">Workout sync not set up</p>
        <p className="mt-1 text-forge-muted">{FEATURE_SYNC_TEMPORARILY_LIMITED}</p>
      </div>
    );
  }

  if (syncedToAccount) {
    return null;
  }

  if (sync?.lastError) {
    return (
      <div
        className={`rounded-xl border border-forge-coral/40 bg-forge-coral/10 text-sm ${
          compact ? "mt-3 p-3" : "p-3 sm:p-4"
        }`}
      >
        <p className="font-medium text-forge-coral">Not in your account yet</p>
        <p className="mt-1 text-forge-muted">{sync.lastError}</p>
        <button
          type="button"
          onClick={() => void sync.runSync()}
          className="mt-2 font-semibold text-forge-ember"
        >
          Retry sync
        </button>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-forge-gold/30 bg-forge-gold/10 text-sm ${
        compact ? "mt-3 p-3" : "p-3 sm:p-4"
      }`}
    >
      <p className="font-medium text-forge-gold">Saved on this device only</p>
      <p className="mt-1 text-forge-muted">
        This workout isn&apos;t in your account yet. Sync to save it across
        devices.
      </p>
      {sync && (
        <button
          type="button"
          onClick={() => void sync.runSync()}
          disabled={sync.syncing}
          className="mt-2 font-semibold text-forge-ember disabled:opacity-50"
        >
          {sync.syncing ? "Syncing…" : "Sync now"}
        </button>
      )}
    </div>
  );
}
