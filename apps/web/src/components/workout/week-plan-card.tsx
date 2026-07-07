"use client";

import type { ProgramPlan, WorkoutSession } from "@forgefit/program-engine";
import { useState } from "react";
import { useOfflineStatus } from "@/hooks/use-online-status";
import { formatShortDate } from "@/lib/workouts/comparison";
import {
  canStartPlanSessionWithOverrides,
  formatPlanSessionDateWithOverrides,
  isScheduleAdjusted,
  type WorkoutScheduleOverride,
} from "@/lib/workouts/schedule-overrides";
import type { DayPlanStatus } from "@/lib/workouts/sessions";
import { WorkoutMusicPicker } from "./workout-music-picker";
import {
  PhasePreviewContent,
  type PhaseTone,
  phasePreviewDuration,
  phasePreviewTitle,
  WorkoutPhaseCards,
} from "./workout-phase-cards";

const phaseAccent: Record<PhaseTone, string> = {
  warmup: "text-forge-gold",
  workout: "text-forge-success",
  recovery: "text-forge-steel",
};

const phaseSectionLabel: Record<PhaseTone, string> = {
  warmup: "Warm-up",
  workout: "Workout",
  recovery: "Recovery",
};

interface WeekPlanCardProps {
  plan: ProgramPlan;
  session: WorkoutSession;
  dayStatus?: DayPlanStatus;
  scheduleOverrides?: WorkoutScheduleOverride[];
  starting: boolean;
  discarding: boolean;
  onStart: () => void;
  onContinue: (clientId: string) => void;
  onDiscard: (clientId: string) => void;
  onViewResults: (clientId: string) => void;
  onAdjustSchedule?: () => void;
}

function cardSurfaceClass(inProgress: boolean, isDone: boolean): string {
  if (inProgress) return "border-forge-ember/40 bg-forge-ember/10";
  if (isDone) return "border-forge-success/30 bg-forge-success/5";
  return "border-[var(--border)] bg-forge-surface-raised";
}

export function WeekPlanCard({
  plan,
  session,
  dayStatus,
  scheduleOverrides = [],
  starting,
  discarding,
  onStart,
  onContinue,
  onDiscard,
  onViewResults,
  onAdjustSchedule,
}: WeekPlanCardProps) {
  const offline = useOfflineStatus();
  const [previewPhase, setPreviewPhase] = useState<PhaseTone | null>(null);
  const inProgress = dayStatus?.inProgress ?? null;
  const completed = dayStatus?.latestCompleted ?? null;
  const isDone = Boolean(completed) && !inProgress;
  const canStart = canStartPlanSessionWithOverrides(
    session.dayIndex,
    plan,
    scheduleOverrides
  );
  const isFlipped = previewPhase !== null;
  const adjusted = isScheduleAdjusted(
    session.dayIndex,
    plan,
    scheduleOverrides
  );

  const completedSets = completed?.sets.filter((s) => s.completed).length ?? 0;
  const totalSets = completed?.sets.length ?? 0;

  const surface = cardSurfaceClass(Boolean(inProgress), isDone);

  return (
    <div className="[perspective:1200px]">
      <div
        className={`grid transition-transform duration-500 [transform-style:preserve-3d] ${
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Front — day overview */}
        <article
          className={`col-start-1 row-start-1 rounded-2xl border p-4 [backface-visibility:hidden] ${surface}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-forge-gold">
                {session.dayLabel}
              </p>
              <p className="text-xs text-forge-muted">
                {formatPlanSessionDateWithOverrides(
                  session.dayIndex,
                  plan,
                  scheduleOverrides
                )}
              </p>
              {adjusted && (
                <p className="text-xs font-medium text-forge-steel">
                  Rescheduled this week
                </p>
              )}
              <h3 className="font-display font-semibold text-forge-text">
                {session.name}
              </h3>
            </div>

            <div className="flex shrink-0 flex-col gap-2">
              {onAdjustSchedule && !isDone && (
                <button
                  type="button"
                  onClick={onAdjustSchedule}
                  className="rounded-lg border border-forge-steel/40 px-4 py-2 text-sm font-medium text-forge-steel transition-colors hover:border-forge-steel/60"
                >
                  Move
                </button>
              )}
              {inProgress ? (
                <>
                  <button
                    type="button"
                    onClick={() => onContinue(inProgress.clientId)}
                    className="rounded-lg bg-forge-ember px-4 py-2 text-sm font-semibold text-white"
                  >
                    Continue
                  </button>
                  <button
                    type="button"
                    disabled={discarding}
                    onClick={() => onDiscard(inProgress.clientId)}
                    className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-forge-muted transition-colors hover:border-forge-coral/40 hover:text-forge-coral disabled:opacity-50"
                  >
                    {discarding ? "Discarding…" : "Discard"}
                  </button>
                </>
              ) : isDone && completed ? (
                <button
                  type="button"
                  onClick={() => onViewResults(completed.clientId)}
                  className="rounded-lg border border-forge-success/40 px-4 py-2 text-sm font-semibold text-forge-success"
                >
                  Results
                </button>
              ) : (
                <button
                  type="button"
                  disabled={starting || !canStart}
                  onClick={onStart}
                  className="rounded-lg bg-forge-ember px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {starting ? "Starting…" : canStart ? "Start" : "Upcoming"}
                </button>
              )}
            </div>
          </div>

          {!isDone && (
            <div className="mt-3.5 border-t border-[var(--border)] pt-3.5">
              <WorkoutMusicPicker offline={offline} />
            </div>
          )}

          <div className="mt-3.5">
            <WorkoutPhaseCards
              session={session}
              onPhaseSelect={setPreviewPhase}
            />
          </div>

          {inProgress && (
            <p className="mt-2.5 text-sm font-medium text-forge-ember">
              In progress — pick up where you left off
            </p>
          )}
          {isDone && completed && (
            <button
              type="button"
              onClick={() => onViewResults(completed.clientId)}
              className="mt-2 text-left text-sm text-forge-success hover:underline"
            >
              Done {formatShortDate(completed.completedAt ?? completed.startedAt)}
              {completedSets > 0 && ` · ${completedSets}/${totalSets} sets`}
              <span className="ml-1 text-forge-steel">· View results</span>
            </button>
          )}
        </article>

        {/* Back — phase preview */}
        <div
          className={`col-start-1 row-start-1 flex flex-col rounded-2xl border p-4 [backface-visibility:hidden] [transform:rotateY(180deg)] ${surface} ${
            !previewPhase ? "invisible" : ""
          }`}
          aria-hidden={!previewPhase}
        >
          {previewPhase && (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className={`text-xs font-semibold uppercase tracking-wider ${phaseAccent[previewPhase]}`}
                  >
                    {phaseSectionLabel[previewPhase]}
                  </p>
                  <h3 className="font-display font-semibold text-forge-text">
                    {phasePreviewTitle(previewPhase, session)}
                  </h3>
                  <p className="mt-0.5 text-sm text-forge-muted">
                    {phasePreviewDuration(previewPhase, session)}
                  </p>
                </div>
              </div>

              <div className="mt-4 min-h-0 flex-1 overflow-y-auto border-t border-[var(--border)] pt-4">
                <PhasePreviewContent tone={previewPhase} session={session} />
              </div>

              <button
                type="button"
                onClick={() => setPreviewPhase(null)}
                className="mt-4 min-h-[44px] w-full rounded-lg border border-[var(--border)] bg-forge-surface px-4 text-sm font-semibold text-forge-text transition-colors hover:border-forge-ember/40"
              >
                Back to overview
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
