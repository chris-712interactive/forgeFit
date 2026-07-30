"use client";

interface ClearWeekBannerProps {
  cleared: boolean;
  clearing: boolean;
  restoring: boolean;
  tableReady: boolean;
  offline: boolean;
  onClear: () => void;
  onRestore: () => void;
  onBuildCustom: () => void;
}

export function ClearWeekBanner({
  cleared,
  clearing,
  restoring,
  tableReady,
  offline,
  onClear,
  onRestore,
  onBuildCustom,
}: ClearWeekBannerProps) {
  if (!tableReady) {
    return (
      <p className="rounded-xl border border-forge-steel/30 bg-forge-surface-raised px-4 py-2 text-sm text-forge-steel">
        Week clearing is temporarily unavailable.
      </p>
    );
  }

  if (cleared) {
    return (
      <div className="rounded-2xl border border-forge-gold/30 bg-forge-gold/5 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-forge-gold">
          Program week cleared
        </p>
        <p className="mt-1 text-sm text-forge-muted">
          This week&apos;s program workouts are hidden. Assign your own custom
          workouts to fill the calendar, or restore the plan anytime.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onBuildCustom}
            className="min-h-[44px] flex-1 rounded-xl bg-forge-ember px-4 text-sm font-semibold text-white transition-colors hover:bg-forge-glow"
          >
            Build custom workout
          </button>
          <button
            type="button"
            disabled={restoring || offline}
            onClick={onRestore}
            className="min-h-[44px] flex-1 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold text-forge-text transition-colors hover:border-forge-steel/50 disabled:opacity-50"
          >
            {restoring ? "Restoring…" : "Restore program week"}
          </button>
        </div>
        {offline && (
          <p className="mt-2 text-xs text-forge-steel">
            Connect to restore the program week.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-forge-muted">
        Prefer your own sessions this week?
      </p>
      <button
        type="button"
        disabled={clearing || offline}
        onClick={onClear}
        className="min-h-[44px] shrink-0 rounded-xl border border-forge-steel/40 px-4 text-sm font-semibold text-forge-steel transition-colors hover:border-forge-steel/60 disabled:opacity-50"
      >
        {clearing ? "Clearing…" : "Clear week's plan"}
      </button>
      {offline && (
        <p className="text-xs text-forge-steel sm:hidden">
          Connect to clear the week.
        </p>
      )}
    </div>
  );
}
