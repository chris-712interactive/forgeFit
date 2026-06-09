"use client";

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
        <p className="mt-1 text-forge-muted">
          Apply{" "}
          <code className="text-xs">20260608200000_phase3_workouts.sql</code> in
          Supabase to create <code className="text-xs">workout_sessions</code>{" "}
          and <code className="text-xs">exercise_sets</code>. Until then,
          workouts stay on this device only.
        </p>
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
        This workout isn&apos;t in Supabase yet (
        <code className="text-xs">workout_sessions</code> /{" "}
        <code className="text-xs">exercise_sets</code>). Sync to save it to your
        account.
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
