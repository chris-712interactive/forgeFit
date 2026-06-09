"use client";

import type { LocalExerciseSet } from "@forgefit/offline-sync";

interface SetRowProps {
  set: LocalExerciseSet;
  targetReps: string;
  onUpdate: (
    clientId: string,
    patch: Partial<Pick<LocalExerciseSet, "reps" | "weightKg" | "rir" | "completed">>
  ) => void;
}

export function SetRow({ set, targetReps, onUpdate }: SetRowProps) {
  return (
    <div
      className={`grid grid-cols-[2rem_1fr_1fr_3rem_3rem] items-center gap-2 rounded-xl border px-2 py-2 ${
        set.completed
          ? "border-forge-success/40 bg-forge-success/5"
          : "border-[var(--border)]"
      }`}
    >
      <span className="text-center text-sm font-semibold text-forge-muted">
        {set.setNumber}
      </span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step={0.5}
        placeholder="kg"
        value={set.weightKg ?? ""}
        onChange={(e) =>
          onUpdate(set.clientId, {
            weightKg: e.target.value === "" ? undefined : Number(e.target.value),
          })
        }
        className="min-h-[44px] rounded-lg border border-[var(--border)] bg-forge-surface px-2 text-sm text-forge-text outline-none focus:border-forge-ember"
        aria-label={`Set ${set.setNumber} weight`}
      />
      <input
        type="number"
        inputMode="numeric"
        min={0}
        placeholder={targetReps}
        value={set.reps ?? ""}
        onChange={(e) =>
          onUpdate(set.clientId, {
            reps: e.target.value === "" ? undefined : Number(e.target.value),
          })
        }
        className="min-h-[44px] rounded-lg border border-[var(--border)] bg-forge-surface px-2 text-sm text-forge-text outline-none focus:border-forge-ember"
        aria-label={`Set ${set.setNumber} reps`}
      />
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={10}
        placeholder="RIR"
        value={set.rir ?? ""}
        onChange={(e) =>
          onUpdate(set.clientId, {
            rir: e.target.value === "" ? undefined : Number(e.target.value),
          })
        }
        className="min-h-[44px] rounded-lg border border-[var(--border)] bg-forge-surface px-2 text-sm text-forge-text outline-none focus:border-forge-ember"
        aria-label={`Set ${set.setNumber} reps in reserve`}
      />
      <button
        type="button"
        onClick={() =>
          onUpdate(set.clientId, {
            completed: !set.completed,
          })
        }
        className={`min-h-[44px] rounded-lg text-xs font-bold ${
          set.completed
            ? "bg-forge-success text-white"
            : "bg-forge-ember/15 text-forge-ember"
        }`}
        aria-label={set.completed ? "Mark set incomplete" : "Complete set"}
      >
        {set.completed ? "✓" : "Go"}
      </button>
    </div>
  );
}
