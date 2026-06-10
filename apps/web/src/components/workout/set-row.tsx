"use client";

import { useUnitPreference } from "@/components/units/unit-preference-provider";
import {
  snapPrescribedWeightKg,
  weightInputStep,
} from "@/lib/progression/load-snapping";
import {
  kgFromDisplayValue,
  kgToDisplayValue,
  weightUnitLabel,
} from "@/lib/units/measurements";
import type { LocalExerciseSet } from "@forgefit/offline-sync";

interface SetRowProps {
  set: LocalExerciseSet;
  exerciseId: string;
  targetReps: string;
  isDurationHold?: boolean;
  targetHoldSeconds?: number;
  isHoldActive?: boolean;
  showProgressionHint?: boolean;
  onStartHold?: (clientId: string) => void;
  onUpdate: (
    clientId: string,
    patch: Partial<Pick<LocalExerciseSet, "reps" | "weightKg" | "rir" | "completed">>
  ) => void;
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

const HOLD_EFFORT_LEVELS = [
  { label: "Easy", rir: 4, description: "Could hold longer" },
  { label: "Good", rir: 2, description: "Solid but challenging" },
  { label: "Hard", rir: 0, description: "Near my limit" },
] as const;

export function SetRow({
  set,
  exerciseId,
  targetReps,
  isDurationHold = false,
  targetHoldSeconds,
  isHoldActive = false,
  showProgressionHint = false,
  onStartHold,
  onUpdate,
}: SetRowProps) {
  const unit = useUnitPreference();
  const weightLabel = weightUnitLabel(unit);
  const weightStep = weightInputStep(exerciseId, unit);
  const effortLevels = isDurationHold ? HOLD_EFFORT_LEVELS : EFFORT_LEVELS;
  const selectedEffort = effortFromRir(set.rir);
  const displayWeight =
    set.weightKg != null
      ? kgToDisplayValue(
          snapPrescribedWeightKg(exerciseId, set.weightKg, unit),
          unit
        )
      : "";

  return (
    <div
      className={`rounded-xl border p-3 ${
        set.completed
          ? "border-forge-success/40 bg-forge-success/5"
          : isHoldActive
            ? "border-forge-ember/50 bg-forge-ember/5"
            : "border-[var(--border)] bg-forge-surface"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="font-display text-sm font-semibold text-forge-text">
          Set {set.setNumber}
          {isHoldActive && (
            <span className="ml-2 text-xs font-medium text-forge-ember">
              Holding…
            </span>
          )}
        </span>
        {isDurationHold && !set.completed ? (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              disabled={isHoldActive || !targetHoldSeconds || !onStartHold}
              onClick={() => onStartHold?.(set.clientId)}
              className="min-h-[44px] rounded-lg bg-forge-ember px-4 text-sm font-bold text-white disabled:opacity-50"
            >
              Start hold
            </button>
            <button
              type="button"
              disabled={isHoldActive}
              onClick={() =>
                onUpdate(set.clientId, {
                  completed: true,
                  reps: set.reps ?? targetHoldSeconds,
                })
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
              })
            }
            className={`min-h-[44px] shrink-0 rounded-lg px-4 text-sm font-bold ${
              set.completed
                ? "bg-forge-success text-white"
                : "bg-forge-ember text-white"
            }`}
          >
            {set.completed ? "Done ✓" : "Log set"}
          </button>
        )}
      </div>

      {isDurationHold ? (
        <label className="min-w-0">
          <span className="mb-1 block text-xs font-medium text-forge-muted">
            Hold time (seconds)
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
            step={5}
            placeholder={targetReps}
            value={set.reps ?? ""}
            onChange={(e) =>
              onUpdate(set.clientId, {
                reps: e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
            className="min-h-[48px] w-full min-w-0 rounded-lg border border-[var(--border)] bg-forge-surface-raised px-3 text-base text-forge-text outline-none focus:border-forge-ember"
          />
        </label>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <label className="min-w-0">
            <span className="mb-1 block text-xs font-medium text-forge-muted">
              Weight ({weightLabel})
              {showProgressionHint && set.weightKg != null && (
                <span className="ml-1 font-normal text-forge-steel">
                  · suggested
                </span>
              )}
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={weightStep}
              placeholder="0"
              value={displayWeight}
              onChange={(e) => {
                if (e.target.value === "") {
                  onUpdate(set.clientId, { weightKg: undefined });
                  return;
                }
                const rawKg = kgFromDisplayValue(Number(e.target.value), unit);
                onUpdate(set.clientId, {
                  weightKg: snapPrescribedWeightKg(exerciseId, rawKg, unit),
                });
              }}
              className="min-h-[48px] w-full min-w-0 rounded-lg border border-[var(--border)] bg-forge-surface-raised px-3 text-base text-forge-text outline-none focus:border-forge-ember"
            />
          </label>
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
        </div>
      )}

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
    </div>
  );
}
