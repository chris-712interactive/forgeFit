"use client";

import type { ConditioningBlock } from "@forgefit/program-engine";

export type ConditioningStatus = "pending" | "completed" | "skipped";

interface ConditioningBlockCardProps {
  block: ConditioningBlock;
  status: ConditioningStatus;
  roundsCompleted: number;
  onLogRound: () => void;
  onMarkComplete: () => void;
  onSkip: () => void;
}

function formatHeader(block: ConditioningBlock): string {
  if (block.format === "amrap") {
    return `${block.timeCapMinutes} min AMRAP`;
  }
  return `${block.rounds} rounds · ${block.restBetweenRoundsSeconds}s rest between rounds`;
}

function sectionLabel(block: ConditioningBlock): string {
  if (block.scope === "finisher") {
    return "Metabolic finisher";
  }
  return "Conditioning circuit";
}

export function ConditioningBlockCard({
  block,
  status,
  roundsCompleted,
  onLogRound,
  onMarkComplete,
  onSkip,
}: ConditioningBlockCardProps) {
  const isDone = status === "completed";
  const isSkipped = status === "skipped";
  const isAmrap = block.format === "amrap";
  const targetRounds = block.rounds;
  const allRoundsLogged = !isAmrap && roundsCompleted >= targetRounds;

  return (
    <section className="rounded-2xl border border-forge-coral/30 bg-forge-coral/5 p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-forge-coral">
            {sectionLabel(block)}
          </p>
          <h2 className="font-display text-base font-semibold text-forge-text sm:text-lg">
            {block.name}
          </h2>
          <p className="mt-1 text-sm text-forge-muted">{formatHeader(block)}</p>
        </div>
        {isDone && (
          <span className="rounded-lg bg-forge-success/15 px-3 py-1 text-xs font-semibold text-forge-success">
            {isAmrap
              ? "Done"
              : `Done · ${roundsCompleted}/${targetRounds} rounds`}
          </span>
        )}
        {isSkipped && (
          <span className="rounded-lg bg-forge-surface px-3 py-1 text-xs font-semibold text-forge-muted">
            Skipped
          </span>
        )}
      </div>

      {block.notes ? (
        <p className="mt-3 text-sm text-forge-muted">{block.notes}</p>
      ) : null}

      <ol className="mt-3 space-y-2 border-t border-forge-coral/20 pt-3">
        {block.movements.map((movement, index) => (
          <li
            key={movement.exerciseId}
            className="flex items-start justify-between gap-3 rounded-lg border border-[var(--border)] bg-forge-surface px-3 py-2.5"
          >
            <span className="text-sm font-medium text-forge-text">
              {index + 1}. {movement.name}
            </span>
            <span className="shrink-0 text-sm text-forge-muted">
              {movement.prescription}
            </span>
          </li>
        ))}
      </ol>

      {!isDone && !isSkipped && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {isAmrap ? (
            <button
              type="button"
              onClick={onMarkComplete}
              className="min-h-[48px] flex-1 rounded-xl bg-forge-ember px-4 text-sm font-semibold text-white"
            >
              Complete AMRAP
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={allRoundsLogged}
                onClick={onLogRound}
                className="min-h-[48px] flex-1 rounded-xl bg-forge-ember px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                {allRoundsLogged
                  ? "All rounds logged"
                  : `Log round ${roundsCompleted + 1} of ${targetRounds}`}
              </button>
              {allRoundsLogged ? (
                <button
                  type="button"
                  onClick={onMarkComplete}
                  className="min-h-[48px] rounded-xl border border-forge-success/40 px-4 text-sm font-semibold text-forge-success"
                >
                  Finish circuit
                </button>
              ) : null}
            </>
          )}
          <button
            type="button"
            onClick={onSkip}
            className="min-h-[48px] rounded-xl border border-[var(--border)] px-4 text-sm font-semibold text-forge-muted"
          >
            Skip
          </button>
        </div>
      )}
    </section>
  );
}
