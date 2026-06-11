"use client";

import { EvidenceExplainerLink } from "@/components/evidence/evidence-explainer-link";
import {
  formatRecoveryDuration,
  recoveryEquipmentLabel,
  recoveryEvidenceHref,
  recoveryGuidanceSteps,
  type RecoveryStatus,
} from "@/lib/workouts/recovery";
import type { RecoveryBlock } from "@forgefit/program-engine";
import { formatTimerSeconds } from "./timer-utils";

interface RecoveryBlockCardProps {
  block: RecoveryBlock;
  status: RecoveryStatus;
  durationMs?: number;
  isTimerActive: boolean;
  onStartTimer: () => void;
  onMarkComplete: () => void;
  onSkip: () => void;
}

export function RecoveryBlockCard({
  block,
  status,
  durationMs,
  isTimerActive,
  onStartTimer,
  onMarkComplete,
  onSkip,
}: RecoveryBlockCardProps) {
  const guidance = recoveryGuidanceSteps(block);
  const isDone = status === "completed";
  const isSkipped = status === "skipped";

  return (
    <section className="rounded-2xl border border-forge-steel/30 bg-forge-steel/5 p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-forge-steel">
            Recovery · post-workout
          </p>
          <h2 className="font-display text-base font-semibold text-forge-text sm:text-lg">
            {block.name}
          </h2>
          <p className="mt-1 text-sm text-forge-muted">
            {formatRecoveryDuration(block.durationMinutes)} ·{" "}
            {recoveryEquipmentLabel(block.equipment)}
          </p>
        </div>
        {isDone && (
          <span className="rounded-lg bg-forge-success/15 px-3 py-1 text-xs font-semibold text-forge-success">
            Done
            {durationMs
              ? ` · ${formatTimerSeconds(Math.round(durationMs / 1000))}`
              : ""}
          </span>
        )}
        {isSkipped && (
          <span className="rounded-lg bg-forge-surface px-3 py-1 text-xs font-semibold text-forge-muted">
            Skipped
          </span>
        )}
      </div>

      {!isDone && !isSkipped && (
        <>
          <ul className="mt-3 space-y-1.5 border-t border-forge-steel/20 pt-3 text-sm text-forge-muted">
            {guidance.map((step) => (
              <li key={step} className="flex gap-2">
                <span className="text-forge-steel">·</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={isTimerActive}
              onClick={onStartTimer}
              className="min-h-[48px] flex-1 rounded-lg bg-forge-steel px-4 text-sm font-bold text-white disabled:opacity-50"
            >
              {isTimerActive ? "Timer running…" : "Start timer"}
            </button>
            <button
              type="button"
              disabled={isTimerActive}
              onClick={onMarkComplete}
              className="min-h-[48px] rounded-lg border border-forge-success/40 px-4 text-sm font-semibold text-forge-success disabled:opacity-50"
            >
              Mark complete
            </button>
            <button
              type="button"
              disabled={isTimerActive}
              onClick={onSkip}
              className="min-h-[48px] rounded-lg border border-[var(--border)] px-4 text-sm font-medium text-forge-muted disabled:opacity-50"
            >
              Skip
            </button>
          </div>
        </>
      )}

      <div className="mt-3">
        <EvidenceExplainerLink
          href={recoveryEvidenceHref(block)}
          label="Why this recovery block?"
        />
      </div>
    </section>
  );
}
