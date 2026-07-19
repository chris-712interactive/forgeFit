"use client";

import {
  clearUserOneRepMax,
  saveUserOneRepMax,
} from "@/app/actions/one-rep-maxes";
import { readActionError } from "@/lib/auth/action-result";
import { EvidenceExplainerLink } from "@/components/evidence/evidence-explainer-link";
import { useUnitPreference } from "@/components/units/unit-preference-provider";
import { buildEvidenceHref } from "@/lib/evidence/present";
import { formatEquipment } from "@/lib/exercises/labels";
import {
  isOneRepMaxEligibleExercise,
} from "@/lib/progression/max-test";
import {
  ONE_REP_MAX_LIFTS,
  resolveOneRepMaxLabel,
} from "@/lib/progression/one-rep-max-lifts";
import type { UserOneRepMaxRow } from "@/lib/progression/user-maxes";
import {
  kgFromDisplayValue,
  kgToDisplayValue,
  weightUnitLabel,
} from "@/lib/units/measurements";
import { searchCatalog, type CatalogExercise } from "@forgefit/exercise-db";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

interface OneRepMaxSettingProps {
  initialMaxes: UserOneRepMaxRow[];
  tableReady?: boolean;
}

function LiftRow({
  exerciseId,
  label,
  value,
  pending,
  savedId,
  weightLabel,
  unit,
  onValueChange,
  onSave,
}: {
  exerciseId: string;
  label: string;
  value: string;
  pending: boolean;
  savedId: string | null;
  weightLabel: string;
  unit: ReturnType<typeof useUnitPreference>;
  onValueChange: (exerciseId: string, value: string) => void;
  onSave: (exerciseId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <label className="min-w-0 flex-1 text-sm">
        <span className="mb-1 block font-medium text-forge-text">{label}</span>
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={unit === "imperial" ? 2.5 : 0.5}
            placeholder={`1RM (${weightLabel})`}
            value={value}
            disabled={pending}
            onChange={(event) => onValueChange(exerciseId, event.target.value)}
            className="min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-forge-surface px-3 text-base text-forge-text outline-none focus:border-forge-ember"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => onSave(exerciseId)}
            className="min-h-[48px] shrink-0 rounded-xl border border-forge-steel/50 px-4 text-sm font-semibold text-forge-steel hover:border-forge-ember hover:text-forge-ember disabled:opacity-60"
          >
            Save
          </button>
        </div>
        {savedId === exerciseId && (
          <span className="mt-1 block text-xs text-forge-success">Saved</span>
        )}
      </label>
    </div>
  );
}

export function OneRepMaxSetting({
  initialMaxes,
  tableReady = true,
}: OneRepMaxSettingProps) {
  const unit = useUnitPreference();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const initialDisplay = useMemo(() => {
    const map = new Map(
      initialMaxes.map((row) => [
        row.exerciseId,
        String(kgToDisplayValue(row.weightKg, unit)),
      ])
    );
    return map;
  }, [initialMaxes, unit]);

  const [values, setValues] = useState<Record<string, string>>(() => {
    const record: Record<string, string> = {};
    for (const lift of ONE_REP_MAX_LIFTS) {
      record[lift.exerciseId] = initialDisplay.get(lift.exerciseId) ?? "";
    }
    for (const row of initialMaxes) {
      record[row.exerciseId] = initialDisplay.get(row.exerciseId) ?? "";
    }
    return record;
  });

  useEffect(() => {
    const record: Record<string, string> = {};
    for (const lift of ONE_REP_MAX_LIFTS) {
      record[lift.exerciseId] = initialDisplay.get(lift.exerciseId) ?? "";
    }
    for (const row of initialMaxes) {
      record[row.exerciseId] = initialDisplay.get(row.exerciseId) ?? "";
    }
    setValues(record);
  }, [initialDisplay, initialMaxes]);

  const featuredIds = useMemo(
    () => new Set<string>(ONE_REP_MAX_LIFTS.map((lift) => lift.exerciseId)),
    []
  );

  const additionalExerciseIds = useMemo(
    () =>
      initialMaxes
        .map((row) => row.exerciseId)
        .filter((exerciseId) => !featuredIds.has(exerciseId)),
    [featuredIds, initialMaxes]
  );

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    return searchCatalog({ q: query, limit: 20 }).filter(
      (exercise) =>
        isOneRepMaxEligibleExercise(exercise.id) &&
        !featuredIds.has(exercise.id) &&
        !additionalExerciseIds.includes(exercise.id)
    );
  }, [additionalExerciseIds, featuredIds, query]);

  const weightLabel = weightUnitLabel(unit);

  function updateValue(exerciseId: string, value: string) {
    setValues((prev) => ({ ...prev, [exerciseId]: value }));
    setSavedId(null);
    setError(null);
  }

  function addExercise(exercise: CatalogExercise) {
    setValues((prev) => ({
      ...prev,
      [exercise.id]: prev[exercise.id] ?? "",
    }));
    setQuery("");
    setError(null);
  }

  function saveLift(exerciseId: string) {
    const raw = values[exerciseId]?.trim();
    if (!raw) {
      startTransition(async () => {
        setError(null);
        const result = await clearUserOneRepMax(exerciseId);
        const actionError = readActionError(result);
        if (actionError) {
          setError(actionError);
          return;
        }
        setSavedId(exerciseId);
        router.refresh();
      });
      return;
    }

    const display = Number(raw);
    if (!Number.isFinite(display) || display <= 0) {
      setError("Enter a positive number or leave blank to clear.");
      return;
    }

    const weightKg = kgFromDisplayValue(display, unit);

    startTransition(async () => {
      setError(null);
      const result = await saveUserOneRepMax(exerciseId, weightKg);
      const actionError = readActionError(result);
      if (actionError) {
        setError(actionError);
        return;
      }
      setSavedId(exerciseId);
      router.refresh();
    });
  }

  if (!tableReady) {
    return (
      <section className="rounded-2xl border border-forge-gold/40 bg-forge-surface-raised p-5">
        <h2 className="font-display text-sm font-semibold text-forge-text">
          Known one-rep maxes
        </h2>
        <p className="mt-2 text-sm text-forge-muted">
          Apply the `user_one_rep_maxes` migration to save your lift maxes and
          improve workout prescriptions.
        </p>
      </section>
    );
  }

  const customExerciseIds = Object.keys(values).filter(
    (exerciseId) =>
      !featuredIds.has(exerciseId) &&
      !additionalExerciseIds.includes(exerciseId) &&
      values[exerciseId] !== undefined
  );

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-5">
      <h2 className="font-display text-sm font-semibold text-forge-text">
        Known one-rep maxes
      </h2>
      <p className="mt-1 text-xs text-forge-muted">
        Optional — anchors weekly weight suggestions as a % of your max. We still
        update from logged sets and max tests when you prove you&apos;re stronger.
      </p>

      <div className="mt-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-forge-muted">
          Primary lifts
        </p>
        {ONE_REP_MAX_LIFTS.map((lift) => (
          <LiftRow
            key={lift.exerciseId}
            exerciseId={lift.exerciseId}
            label={lift.label}
            value={values[lift.exerciseId] ?? ""}
            pending={pending}
            savedId={savedId}
            weightLabel={weightLabel}
            unit={unit}
            onValueChange={updateValue}
            onSave={saveLift}
          />
        ))}
      </div>

      {(additionalExerciseIds.length > 0 || customExerciseIds.length > 0) && (
        <div className="mt-6 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-forge-muted">
            Other saved maxes
          </p>
          {[...additionalExerciseIds, ...customExerciseIds].map((exerciseId) => (
            <LiftRow
              key={exerciseId}
              exerciseId={exerciseId}
              label={resolveOneRepMaxLabel(exerciseId)}
              value={values[exerciseId] ?? ""}
              pending={pending}
              savedId={savedId}
              weightLabel={weightLabel}
              unit={unit}
              onValueChange={updateValue}
              onSave={saveLift}
            />
          ))}
        </div>
      )}

      <div className="mt-6 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-forge-muted">
          Add another exercise
        </p>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search exercises"
          className="min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-forge-surface px-3 text-base text-forge-text outline-none focus:border-forge-ember"
        />
        {query.trim() && (
          <ul className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-[var(--border)] bg-forge-surface p-2">
            {searchResults.map((exercise) => (
              <li key={exercise.id}>
                <button
                  type="button"
                  onClick={() => addExercise(exercise)}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-forge-surface-raised"
                >
                  <span className="text-forge-text">{exercise.name}</span>
                  <span className="text-xs text-forge-muted">
                    {formatEquipment(exercise.equipment[0] ?? "bodyweight_only")}
                  </span>
                </button>
              </li>
            ))}
            {searchResults.length === 0 && (
              <li className="px-2 py-2 text-sm text-forge-muted">No matches.</li>
            )}
          </ul>
        )}
      </div>

      <div className="mt-4">
        <EvidenceExplainerLink
          href={buildEvidenceHref({ focus: "rir_autoregulation" })}
          label="How we use your 1RM"
        />
      </div>

      {error && (
        <p className="mt-3 text-sm text-forge-coral" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
