"use client";

import { EvidenceExplainerLink } from "@/components/evidence/evidence-explainer-link";
import {
  formatWarmupDuration,
  warmupEvidenceHref,
  type WarmupStatus,
} from "@/lib/workouts/warmup";
import type { WarmupBlock } from "@forgefit/program-engine";
import { useState } from "react";
import { formatTimerSeconds } from "./timer-utils";

interface WarmupBlockCardProps {
  block: WarmupBlock;
  status: WarmupStatus;
  durationMs?: number;
  isTimerActive: boolean;
  onStartTimer: () => void;
  onMarkComplete: () => void;
  onSkip: () => void;
}

export function WarmupBlockCard({
  block,
  status,
  durationMs,
  isTimerActive,
  onStartTimer,
  onMarkComplete,
  onSkip,
}: WarmupBlockCardProps) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const isDone = status === "completed";
  const isSkipped = status === "skipped";
  const allChecked =
    block.movements.length === 0 ||
    block.movements.every((movement) => checkedIds.has(movement.id));

  function toggleMovement(id: string) {
    setCheckedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className="rounded-2xl border border-forge-gold/30 bg-forge-gold/5 p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-forge-gold">
            Warm-up · before main work
          </p>
          <h2 className="font-display text-base font-semibold text-forge-text sm:text-lg">
            {block.name}
          </h2>
          <p className="mt-1 text-sm text-forge-muted">
            {formatWarmupDuration(block.durationMinutes)} ·{" "}
            {block.movements.length} movements
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
          <ul className="mt-3 space-y-2 border-t border-forge-gold/20 pt-3">
            {block.movements.map((movement) => {
              const checked = checkedIds.has(movement.id);
              return (
                <li key={movement.id}>
                  <button
                    type="button"
                    onClick={() => toggleMovement(movement.id)}
                    className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      checked
                        ? "border-forge-success/40 bg-forge-success/10"
                        : "border-[var(--border)] bg-forge-surface"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-bold ${
                        checked
                          ? "border-forge-success bg-forge-success text-white"
                          : "border-[var(--border)] text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-forge-text">
                        {movement.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-forge-muted">
                        {movement.prescription}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={isTimerActive}
              onClick={onStartTimer}
              className="min-h-[48px] flex-1 rounded-lg bg-forge-gold px-4 text-sm font-bold text-forge-surface disabled:opacity-50"
            >
              {isTimerActive ? "Timer running…" : "Start timer"}
            </button>
            <button
              type="button"
              disabled={isTimerActive || !allChecked}
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

          {!allChecked && (
            <p className="mt-2 text-xs text-forge-muted">
              Check off each movement, or skip if you are short on time.
            </p>
          )}
        </>
      )}

      <div className="mt-3">
        <EvidenceExplainerLink
          href={warmupEvidenceHref()}
          label="Why warm up?"
        />
      </div>
    </section>
  );
}
