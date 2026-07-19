"use client";

import {
  expandUserEquipment,
  isExerciseAvailable,
  searchCatalog,
  type CatalogExercise,
} from "@forgefit/exercise-db";
import { startWorkoutSession } from "@forgefit/offline-sync";
import { formatEquipment } from "@/lib/exercises/labels";
import {
  buildMaxTestSessionName,
  isOneRepMaxEligibleExercise,
} from "@/lib/progression/max-test";
import { CUSTOM_DAY_INDEX } from "@/lib/workouts/session-source";
import { useEffect, useMemo, useState } from "react";

interface MaxTestLauncherProps {
  open: boolean;
  userId: string;
  userEquipment: string[];
  declaredE1rmKg?: Record<string, number>;
  onClose: () => void;
  onStarted: (clientId: string) => void;
}

const inputClass =
  "min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-forge-surface px-3 text-forge-text outline-none focus:border-forge-ember";

export function MaxTestLauncher({
  open,
  userId,
  userEquipment,
  declaredE1rmKg = {},
  onClose,
  onStarted,
}: MaxTestLauncherProps) {
  const [query, setQuery] = useState("");
  const [availableOnly, setAvailableOnly] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setError(null);
      setStarting(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const searchResults = useMemo(() => {
    const results = searchCatalog({ q: query, limit: 40 });
    return results.filter((exercise) => {
      if (!isOneRepMaxEligibleExercise(exercise.id)) return false;
      if (availableOnly && !isExerciseAvailable(exercise, userEquipment)) {
        return false;
      }
      return true;
    });
  }, [availableOnly, query, userEquipment]);

  const featuredResults = useMemo(() => {
    if (query.trim()) return [];
    const results = searchCatalog({ q: "", limit: 200 });
    return results
      .filter((exercise) => isOneRepMaxEligibleExercise(exercise.id))
      .filter((exercise) =>
        availableOnly ? isExerciseAvailable(exercise, userEquipment) : true
      )
      .slice(0, 8);
  }, [availableOnly, query, userEquipment]);

  if (!open) return null;

  async function startMaxTest(exercise: CatalogExercise) {
    setStarting(true);
    setError(null);
    try {
      const priorMax = declaredE1rmKg[exercise.id];
      const clientId = await startWorkoutSession({
        userId,
        sessionName: buildMaxTestSessionName(exercise.name),
        dayIndex: CUSTOM_DAY_INDEX,
        sessionSource: "custom",
        exercises: [
          {
            exerciseId: exercise.id,
            name: exercise.name,
            sets: 1,
            reps: "1",
            restSeconds: 0,
            notes: "Record your heaviest successful single rep.",
          },
        ],
        setPrefills: priorMax
          ? {
              [exercise.id]: {
                weightKg: priorMax,
                reps: 1,
              },
            }
          : undefined,
      });
      onStarted(clientId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start max test.");
    } finally {
      setStarting(false);
    }
  }

  function renderExerciseButton(exercise: CatalogExercise) {
    const priorMax = declaredE1rmKg[exercise.id];
    return (
      <li key={exercise.id}>
        <button
          type="button"
          disabled={starting}
          onClick={() => void startMaxTest(exercise)}
          className="flex w-full items-center justify-between rounded-lg px-2 py-3 text-left text-sm hover:bg-forge-surface disabled:opacity-60"
        >
          <span>
            <span className="block font-medium text-forge-text">{exercise.name}</span>
            {priorMax != null && (
              <span className="mt-0.5 block text-xs text-forge-muted">
                Current max saved
              </span>
            )}
          </span>
          <span className="text-xs text-forge-muted">
            {formatEquipment(exercise.equipment[0] ?? "bodyweight_only")}
          </span>
        </button>
      </li>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-forge-surface">
      <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-forge-text">
            Test 1RM
          </h2>
          <p className="mt-0.5 text-sm text-forge-muted">
            Pick a lift, attempt your max, and save it to your profile.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] rounded-xl border border-[var(--border)] px-4 text-sm font-medium text-forge-muted"
        >
          Close
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4">
          <input
            type="search"
            className={inputClass}
            placeholder="Search exercises"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <label className="flex items-center gap-2 text-sm text-forge-muted">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(event) => setAvailableOnly(event.target.checked)}
            />
            Only show exercises I can do with my equipment
          </label>

          {!query.trim() && featuredResults.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-forge-muted">
                Common lifts
              </p>
              <ul className="space-y-1">
                {featuredResults.map((exercise) => renderExerciseButton(exercise))}
              </ul>
            </div>
          )}

          {query.trim() && (
            <ul className="max-h-[50vh] space-y-1 overflow-y-auto">
              {searchResults.map((exercise) => renderExerciseButton(exercise))}
              {searchResults.length === 0 && (
                <p className="text-sm text-forge-muted">
                  No weight-tracked exercises match your search.
                </p>
              )}
            </ul>
          )}
        </section>

        {error && (
          <p className="mt-3 text-sm text-forge-coral" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
