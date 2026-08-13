"use client";

interface InProgressCustomWorkoutCardProps {
  sessionName: string;
  completedSets: number;
  totalSets: number;
  discarding: boolean;
  onContinue: () => void;
  onDiscard: () => void;
}

export function InProgressCustomWorkoutCard({
  sessionName,
  completedSets,
  totalSets,
  discarding,
  onContinue,
  onDiscard,
}: InProgressCustomWorkoutCardProps) {
  return (
    <article className="rounded-2xl border border-forge-ember/40 bg-forge-ember/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-forge-ember">
            Custom · In progress
          </p>
          <h3 className="font-display font-semibold text-forge-text">
            {sessionName}
          </h3>
          <p className="mt-1 text-sm text-forge-muted">
            {completedSets}/{totalSets} sets logged — pick up where you left off
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <button
            type="button"
            onClick={onContinue}
            className="rounded-lg bg-forge-ember px-4 py-2 text-sm font-semibold text-white"
          >
            Continue
          </button>
          <button
            type="button"
            disabled={discarding}
            onClick={onDiscard}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-forge-muted transition-colors hover:border-forge-coral/40 hover:text-forge-coral disabled:opacity-50"
          >
            {discarding ? "Discarding…" : "Discard"}
          </button>
        </div>
      </div>
    </article>
  );
}
