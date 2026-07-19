"use client";

import { useUnitPreference } from "@/components/units/unit-preference-provider";
import { weightUnitLabel } from "@/lib/units/measurements";
import { useWorkoutWeightInput } from "@/components/workout/use-workout-weight-input";
import {
  exerciseLogsPerDumbbell,
  exerciseTracksWeight,
  isTimedCardioExercise,
  isTimedExercise,
  parseTimedTargetValue,
  timedDurationPartsFromMs,
  timedMsFromParts,
  timedSetTotalMs,
} from "@forgefit/exercise-db";
import type { LocalExerciseSet } from "@forgefit/offline-sync";
import { useCallback } from "react";

interface SetRowProps {
  set: LocalExerciseSet;
  exerciseId: string;
  targetReps: string;
  targetTimerSeconds?: number;
  isTimerActive?: boolean;
  showProgressionHint?: boolean;
  setRole?: LocalExerciseSet["setRole"];
  warmupIndex?: number;
  onStartTimer?: (clientId: string) => void;
  onUpdate: (
    clientId: string,
    patch: Partial<
      Pick<
        LocalExerciseSet,
        | "reps"
        | "durationMs"
        | "weightKg"
        | "rir"
        | "completed"
      >
    >
  ) => void;
}

function clampDurationSeconds(value: number): number {
  return Math.min(59, Math.max(0, Math.round(value)));
}

function timedManualLogPatch(
  set: LocalExerciseSet,
  exerciseId: string,
  targetMinutes: number
): Partial<LocalExerciseSet> {
  const durationMs =
    set.durationMs ??
    timedSetTotalMs(set, exerciseId) ??
    timedMsFromParts(targetMinutes, 0);
  const parts = timedDurationPartsFromMs(durationMs);
  return {
    durationMs,
    reps: isTimedCardioExercise(exerciseId) ? parts.minutes : parts.seconds,
    completed: true,
  };
}

const EFFORT_LEVELS = [
  { label: "Easy", rir: 4, description: "Could do more reps" },
  { label: "Good", rir: 2, description: "1–2 reps left" },
  { label: "Hard", rir: 0, description: "Near my limit" },
] as const;

function effortFromRir(rir?: number): number | undefined {
  if (rir === undefined) return undefined;
  if (rir >= 3) return 4;
  if (rir >= 1) return 2;
  return 0;
}

const TIMED_EFFORT_LEVELS = [
  { label: "Easy", rir: 4, description: "Could go longer" },
  { label: "Good", rir: 2, description: "Solid but challenging" },
  { label: "Hard", rir: 0, description: "Near my limit" },
] as const;

export function SetRow({
  set,
  exerciseId,
  targetReps,
  targetTimerSeconds,
  isTimerActive = false,
  showProgressionHint = false,
  setRole,
  warmupIndex,
  onStartTimer,
  onUpdate,
}: SetRowProps) {
  const isMaxAttempt = setRole === "max_attempt";
  const isWarmup = setRole === "warmup";
  const isTimed = isTimedExercise(exerciseId);
  const isCardio = isTimedCardioExercise(exerciseId);
  const tracksWeight = exerciseTracksWeight(exerciseId);
  const perDumbbell = exerciseLogsPerDumbbell(exerciseId);
  const targetLogValue = parseTimedTargetValue(targetReps);
  const unit = useUnitPreference();
  const weightLabel = weightUnitLabel(unit);
  const effortLevels = isTimed ? TIMED_EFFORT_LEVELS : EFFORT_LEVELS;
  const durationParts = timedDurationPartsFromMs(
    timedSetTotalMs(set, exerciseId) ?? 0
  );
  const selectedEffort = effortFromRir(set.rir);

  const commitWeight = useCallback(
    (weightKg: number | undefined) => {
      onUpdate(set.clientId, { weightKg });
    },
    [onUpdate, set.clientId]
  );

  const weightInput = useWorkoutWeightInput({
    exerciseId,
    weightKg: set.weightKg,
    unit,
    onCommit: commitWeight,
  });

  return (
    <div
      className={`rounded-xl border p-3 ${
        set.completed
          ? "border-forge-success/40 bg-forge-success/5"
          : isTimerActive
            ? "border-forge-ember/50 bg-forge-ember/5"
            : "border-[var(--border)] bg-forge-surface"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="font-display text-sm font-semibold text-forge-text">
          {isMaxAttempt
            ? "Max attempt"
            : isWarmup
              ? `Warmup ${warmupIndex ?? set.setNumber}`
              : isCardio
                ? "Session"
                : `Set ${set.setNumber}`}
          {isTimerActive && (
            <span className="ml-2 text-xs font-medium text-forge-ember">
              {isCardio ? "In progress…" : "Holding…"}
            </span>
          )}
        </span>
        {isTimed && !set.completed ? (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              disabled={isTimerActive || !targetTimerSeconds || !onStartTimer}
              onClick={() => onStartTimer?.(set.clientId)}
              className="min-h-[44px] rounded-lg bg-forge-ember px-4 text-sm font-bold text-white disabled:opacity-50"
            >
              {isCardio ? "Start timer" : "Start hold"}
            </button>
            <button
              type="button"
              disabled={isTimerActive}
              onClick={() =>
                onUpdate(
                  set.clientId,
                  timedManualLogPatch(set, exerciseId, targetLogValue)
                )
              }
              className="min-h-[44px] rounded-lg border border-[var(--border)] px-3 text-sm font-medium text-forge-muted disabled:opacity-50"
            >
              Log
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() =>
              onUpdate(set.clientId, {
                completed: !set.completed,
                ...(isMaxAttempt && !set.completed
                  ? { reps: 1, rir: 0 }
                  : {}),
              })
            }
            className={`min-h-[44px] shrink-0 rounded-lg px-4 text-sm font-bold ${
              set.completed
                ? "bg-forge-success text-white"
                : "bg-forge-ember text-white"
            }`}
          >
            {set.completed
              ? "Done ✓"
              : isMaxAttempt
                ? "Record max"
                : "Log set"}
          </button>
        )}
      </div>

      {isTimed ? (
        isCardio ? (
          <div className="grid grid-cols-2 gap-3">
            <label className="min-w-0">
              <span className="mb-1 block text-xs font-medium text-forge-muted">
                Minutes
                {showProgressionHint && set.durationMs != null && (
                  <span className="ml-1 font-normal text-forge-steel">
                    · suggested
                  </span>
                )}
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                placeholder={targetReps}
                value={set.durationMs != null ? durationParts.minutes : set.reps ?? ""}
                onChange={(e) => {
                  if (e.target.value === "") {
                    onUpdate(set.clientId, { durationMs: undefined, reps: undefined });
                    return;
                  }
                  const minutes = Number(e.target.value);
                  const durationMs = timedMsFromParts(minutes, durationParts.seconds);
                  onUpdate(set.clientId, { durationMs, reps: minutes });
                }}
                className="min-h-[48px] w-full min-w-0 rounded-lg border border-[var(--border)] bg-forge-surface-raised px-3 text-base text-forge-text outline-none focus:border-forge-ember"
              />
            </label>
            <label className="min-w-0">
              <span className="mb-1 block text-xs font-medium text-forge-muted">
                Seconds
                {showProgressionHint && set.durationMs != null && (
                  <span className="ml-1 font-normal text-forge-steel">
                    · suggested
                  </span>
                )}
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={59}
                step={1}
                placeholder="0"
                value={set.durationMs != null ? durationParts.seconds : ""}
                onChange={(e) => {
                  if (e.target.value === "") {
                    onUpdate(set.clientId, {
                      durationMs: timedMsFromParts(durationParts.minutes, 0),
                    });
                    return;
                  }
                  const seconds = clampDurationSeconds(Number(e.target.value));
                  const durationMs = timedMsFromParts(durationParts.minutes, seconds);
                  onUpdate(set.clientId, {
                    durationMs,
                    reps: durationParts.minutes,
                  });
                }}
                className="min-h-[48px] w-full min-w-0 rounded-lg border border-[var(--border)] bg-forge-surface-raised px-3 text-base text-forge-text outline-none focus:border-forge-ember"
              />
            </label>
          </div>
        ) : (
          <label className="min-w-0">
            <span className="mb-1 block text-xs font-medium text-forge-muted">
              Hold time (seconds)
              {showProgressionHint && set.durationMs != null && (
                <span className="ml-1 font-normal text-forge-steel">
                  · suggested
                </span>
              )}
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={5}
              placeholder={targetReps}
              value={
                set.durationMs != null
                  ? durationParts.seconds
                  : set.reps ?? ""
              }
              onChange={(e) => {
                const seconds =
                  e.target.value === "" ? undefined : Number(e.target.value);
                onUpdate(set.clientId, {
                  durationMs:
                    seconds != null ? timedMsFromParts(0, seconds) : undefined,
                  reps: seconds,
                });
              }}
              className="min-h-[48px] w-full min-w-0 rounded-lg border border-[var(--border)] bg-forge-surface-raised px-3 text-base text-forge-text outline-none focus:border-forge-ember"
            />
          </label>
        )
      ) : tracksWeight ? (
        <div className="grid grid-cols-2 gap-3">
          <label className="min-w-0">
            <span className="mb-1 block text-xs font-medium text-forge-muted">
              Weight ({weightLabel})
              {perDumbbell && (
                <span className="ml-1 font-normal text-forge-steel">
                  · per dumbbell
                </span>
              )}
              {showProgressionHint && set.weightKg != null && (
                <span className="ml-1 font-normal text-forge-steel">
                  · suggested
                </span>
              )}
            </span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={weightInput.text}
              onFocus={weightInput.handleFocus}
              onBlur={weightInput.handleBlur}
              onChange={(e) => weightInput.handleChange(e.target.value)}
              className="min-h-[48px] w-full min-w-0 rounded-lg border border-[var(--border)] bg-forge-surface-raised px-3 text-base text-forge-text outline-none focus:border-forge-ember"
            />
          </label>
          <label className="min-w-0">
            <span className="mb-1 block text-xs font-medium text-forge-muted">
              Reps
              {isMaxAttempt && (
                <span className="ml-1 font-normal text-forge-steel">
                  · single rep
                </span>
              )}
              {isWarmup && (
                <span className="ml-1 font-normal text-forge-steel">
                  · ramp-up
                </span>
              )}
              {showProgressionHint && set.reps != null && (
                <span className="ml-1 font-normal text-forge-steel">
                  · suggested
                </span>
              )}
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={isMaxAttempt ? 1 : 0}
              max={isMaxAttempt ? 1 : undefined}
              placeholder={isMaxAttempt ? "1" : isWarmup ? "3-5" : targetReps}
              value={isMaxAttempt ? (set.reps ?? 1) : (set.reps ?? "")}
              readOnly={isMaxAttempt}
              onChange={(e) =>
                onUpdate(set.clientId, {
                  reps:
                    e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              className="min-h-[48px] w-full min-w-0 rounded-lg border border-[var(--border)] bg-forge-surface-raised px-3 text-base text-forge-text outline-none focus:border-forge-ember read-only:opacity-80"
            />
          </label>
        </div>
      ) : (
        <label className="min-w-0">
          <span className="mb-1 block text-xs font-medium text-forge-muted">
            Reps
            {showProgressionHint && set.reps != null && (
              <span className="ml-1 font-normal text-forge-steel">
                · suggested
              </span>
            )}
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={targetReps}
            value={set.reps ?? ""}
            onChange={(e) =>
              onUpdate(set.clientId, {
                reps:
                  e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
            className="min-h-[48px] w-full min-w-0 rounded-lg border border-[var(--border)] bg-forge-surface-raised px-3 text-base text-forge-text outline-none focus:border-forge-ember"
          />
        </label>
      )}

      {!isMaxAttempt && (
        <div className="mt-3">
          <p className="text-xs font-medium text-forge-muted">
            How hard was it?{" "}
            <span className="font-normal text-forge-muted/80">optional</span>
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {effortLevels.map((level) => {
              const selected = selectedEffort === level.rir;
              return (
                <button
                  key={level.label}
                  type="button"
                  onClick={() =>
                    onUpdate(set.clientId, {
                      rir: selected ? undefined : level.rir,
                    })
                  }
                  className={`flex min-h-[52px] flex-col items-center justify-center rounded-lg border px-1 text-center transition-colors ${
                    selected
                      ? "border-forge-ember bg-forge-ember/15 text-forge-ember"
                      : "border-[var(--border)] text-forge-muted hover:border-forge-muted"
                  }`}
                >
                  <span className="text-sm font-semibold">{level.label}</span>
                  <span className="mt-0.5 text-[10px] leading-tight opacity-80">
                    {level.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isMaxAttempt && (
        <p className="mt-3 text-xs text-forge-muted">
          Enter the heaviest weight you successfully lifted for one rep, then tap
          Record max.
        </p>
      )}
    </div>
  );
}
