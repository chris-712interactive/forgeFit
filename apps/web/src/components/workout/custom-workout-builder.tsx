"use client";

import {
  expandUserEquipment,
  isExerciseAvailable,
  searchCatalog,
  type CatalogExercise,
} from "@forgefit/exercise-db";
import {
  startWorkoutSession,
  type WorkoutTemplateExercise,
} from "@forgefit/offline-sync";
import { formatEquipment } from "@/lib/exercises/labels";
import {
  buildCustomWarmupBlock,
  CUSTOM_WARMUP_OPTIONS,
  type CustomWarmupFocus,
} from "@/lib/workouts/custom-warmup";
import {
  buildForgeRepWorkoutTemplateCsv,
  type ParsedWorkoutTemplate,
} from "@/lib/workouts/workout-csv-parser";
import {
  CUSTOM_DAY_INDEX,
  MAX_CUSTOM_EXERCISES,
} from "@/lib/workouts/session-source";
import type { WarmupBlock } from "@forgefit/program-engine";
import { useEffect, useMemo, useRef, useState } from "react";

export interface CustomWorkoutDraft {
  name: string;
  exercises: WorkoutTemplateExercise[];
  warmup?: WarmupBlock;
  imported?: boolean;
}

interface CustomWorkoutBuilderProps {
  open: boolean;
  userId: string;
  userEquipment: string[];
  canImport: boolean;
  templates: Array<{
    id: string;
    name: string;
    exercises: WorkoutTemplateExercise[];
    warmup?: WarmupBlock | null;
  }>;
  initialDraft?: CustomWorkoutDraft | null;
  onClose: () => void;
  onStarted: (clientId: string) => void;
}

const inputClass =
  "min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-forge-surface px-3 text-forge-text outline-none focus:border-forge-ember";

function defaultExercise(exercise: CatalogExercise): WorkoutTemplateExercise {
  return {
    exerciseId: exercise.id,
    name: exercise.name,
    sets: 3,
    reps: "8-12",
    restSeconds: 90,
  };
}

export function CustomWorkoutBuilder({
  open,
  userId,
  userEquipment,
  canImport,
  templates,
  initialDraft,
  onClose,
  onStarted,
}: CustomWorkoutBuilderProps) {
  const importRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("Custom workout");
  const [exercises, setExercises] = useState<WorkoutTemplateExercise[]>([]);
  const [availableOnly, setAvailableOnly] = useState(true);
  const [query, setQuery] = useState("");
  const [warmupFocus, setWarmupFocus] = useState<CustomWarmupFocus | "none">("none");
  const [starting, setStarting] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initialDraft?.name ?? "Custom workout");
    setExercises(initialDraft?.exercises ?? []);
    setWarmupFocus(initialDraft?.warmup?.focus ?? "none");
    setQuery("");
    setMessage(null);
    setError(null);
  }, [open, initialDraft]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const gear = useMemo(() => expandUserEquipment(userEquipment), [userEquipment]);

  const searchResults = useMemo(() => {
    const results = searchCatalog({ q: query, limit: 40 });
    return results.filter((exercise) => {
      if (!availableOnly) return true;
      return isExerciseAvailable(exercise, userEquipment);
    });
  }, [availableOnly, query, userEquipment]);

  const warmupBlock =
    warmupFocus === "none" ? undefined : buildCustomWarmupBlock(warmupFocus);

  if (!open) return null;

  function addExercise(exercise: CatalogExercise) {
    if (exercises.length >= MAX_CUSTOM_EXERCISES) {
      setError(`Maximum ${MAX_CUSTOM_EXERCISES} exercises per workout.`);
      return;
    }
    if (exercises.some((row) => row.exerciseId === exercise.id)) return;
    setExercises((current) => [...current, defaultExercise(exercise)]);
    setError(null);
  }

  function updateExercise(
    index: number,
    patch: Partial<WorkoutTemplateExercise>
  ) {
    setExercises((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row
      )
    );
  }

  function removeExercise(index: number) {
    setExercises((current) => current.filter((_, rowIndex) => rowIndex !== index));
  }

  function moveExercise(index: number, direction: -1 | 1) {
    setExercises((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      const temp = next[index]!;
      next[index] = next[target]!;
      next[target] = temp;
      return next;
    });
  }

  function loadTemplate(template: CustomWorkoutBuilderProps["templates"][number]) {
    setName(template.name);
    setExercises(template.exercises);
    setWarmupFocus(template.warmup?.focus ?? "none");
    setMessage(`Loaded template “${template.name}”.`);
    setError(null);
  }

  async function handleStart() {
    if (exercises.length === 0) {
      setError("Add at least one exercise.");
      return;
    }

    setStarting(true);
    setError(null);
    try {
      const clientId = await startWorkoutSession({
        userId,
        sessionName: name.trim() || "Custom workout",
        dayIndex: CUSTOM_DAY_INDEX,
        sessionSource: initialDraft?.imported ? "imported" : "custom",
        exercises,
        warmupBlock,
      });
      onStarted(clientId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start workout.");
    } finally {
      setStarting(false);
    }
  }

  async function handleSaveTemplate() {
    if (exercises.length === 0) {
      setError("Add at least one exercise before saving.");
      return;
    }

    setSavingTemplate(true);
    setError(null);
    try {
      const response = await fetch("/api/workout-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "Custom workout",
          exercises,
          warmup: warmupBlock,
        }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Could not save template.");
      }
      setMessage("Template saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save template.");
    } finally {
      setSavingTemplate(false);
    }
  }

  function handleExportTemplate() {
    const csv = buildForgeRepWorkoutTemplateCsv({
      name: name.trim() || "Custom workout",
      exercises,
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(name.trim() || "custom-workout").replace(/\s+/g, "-").toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImporting(true);
    setError(null);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/workouts/import", { method: "POST", body: formData });
      const body = (await response.json()) as {
        error?: string;
        workout?: ParsedWorkoutTemplate;
        warnings?: string[];
      };
      if (!response.ok) {
        throw new Error(body.error ?? "Import failed.");
      }
      if (!body.workout) {
        throw new Error("No workout found in CSV.");
      }
      setName(body.workout.name);
      setExercises(body.workout.exercises);
      setMessage(
        `Imported ${body.workout.exercises.length} exercise${
          body.workout.exercises.length === 1 ? "" : "s"
        }.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-forge-surface">
      <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <button type="button" onClick={onClose} className="text-sm font-semibold text-forge-ember">
          Cancel
        </button>
        <h2 className="font-display text-sm font-semibold text-forge-text">Custom workout</h2>
        <button
          type="button"
          disabled={starting || exercises.length === 0}
          onClick={() => void handleStart()}
          className="text-sm font-semibold text-forge-success disabled:opacity-50"
        >
          {starting ? "Starting…" : "Start"}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-lg space-y-5">
          <label className="block space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-forge-muted">
              Workout name
            </span>
            <input
              className={inputClass}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>

          {templates.length > 0 && (
            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-forge-muted">
                Saved templates
              </p>
              <div className="flex flex-wrap gap-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => loadTemplate(template)}
                    className="rounded-full border border-[var(--border)] px-3 py-1.5 text-sm text-forge-text hover:border-forge-ember/40"
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-forge-muted">
              Add exercises
            </p>
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
            {query.trim() && (
              <ul className="max-h-48 space-y-1 overflow-y-auto">
                {searchResults.map((exercise) => (
                  <li key={exercise.id}>
                    <button
                      type="button"
                      onClick={() => addExercise(exercise)}
                      className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-forge-surface"
                    >
                      <span className="text-forge-text">{exercise.name}</span>
                      <span className="text-xs text-forge-muted">
                        {formatEquipment(exercise.equipment[0] ?? "bodyweight_only")}
                      </span>
                    </button>
                  </li>
                ))}
                {searchResults.length === 0 && (
                  <p className="text-sm text-forge-muted">No matches.</p>
                )}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-forge-muted">
              Exercises ({exercises.length}/{MAX_CUSTOM_EXERCISES})
            </p>
            {exercises.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-forge-muted">
                Search and add exercises from your equipment-aware library.
              </p>
            ) : (
              <div className="space-y-3">
                {exercises.map((exercise, index) => (
                  <div
                    key={`${exercise.exerciseId}-${index}`}
                    className="rounded-xl border border-[var(--border)] bg-forge-surface-raised p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-forge-text">{exercise.name}</p>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          aria-label="Move up"
                          disabled={index === 0}
                          onClick={() => moveExercise(index, -1)}
                          className="px-2 text-forge-muted disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          aria-label="Move down"
                          disabled={index === exercises.length - 1}
                          onClick={() => moveExercise(index, 1)}
                          className="px-2 text-forge-muted disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeExercise(index)}
                          className="px-2 text-forge-coral"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <label className="space-y-1 text-xs text-forge-muted">
                        Sets
                        <input
                          type="number"
                          min={1}
                          max={10}
                          className={inputClass}
                          value={exercise.sets}
                          onChange={(event) =>
                            updateExercise(index, { sets: Number(event.target.value) })
                          }
                        />
                      </label>
                      <label className="space-y-1 text-xs text-forge-muted">
                        Reps
                        <input
                          className={inputClass}
                          value={exercise.reps}
                          onChange={(event) =>
                            updateExercise(index, { reps: event.target.value })
                          }
                        />
                      </label>
                      <label className="space-y-1 text-xs text-forge-muted">
                        Rest (sec)
                        <input
                          type="number"
                          min={0}
                          max={600}
                          className={inputClass}
                          value={exercise.restSeconds}
                          onChange={(event) =>
                            updateExercise(index, {
                              restSeconds: Number(event.target.value),
                            })
                          }
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-2">
            <label className="block space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-forge-muted">
                Warmup (optional)
              </span>
              <select
                className={inputClass}
                value={warmupFocus}
                onChange={(event) =>
                  setWarmupFocus(event.target.value as CustomWarmupFocus | "none")
                }
              >
                <option value="none">No warmup</option>
                {CUSTOM_WARMUP_OPTIONS.map((option) => (
                  <option key={option.focus} value={option.focus}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={savingTemplate || exercises.length === 0}
              onClick={() => void handleSaveTemplate()}
              className="min-h-[44px] rounded-xl border border-forge-steel/40 text-sm font-semibold text-forge-steel disabled:opacity-50"
            >
              {savingTemplate ? "Saving…" : "Save template"}
            </button>
            <button
              type="button"
              disabled={exercises.length === 0}
              onClick={handleExportTemplate}
              className="min-h-[44px] rounded-xl border border-forge-steel/40 text-sm font-semibold text-forge-steel disabled:opacity-50"
            >
              Export template CSV
            </button>
          </div>

          {canImport && (
            <>
              <input
                ref={importRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(event) => void handleImportFile(event)}
              />
              <button
                type="button"
                disabled={importing}
                onClick={() => importRef.current?.click()}
                className="min-h-[44px] w-full rounded-xl border border-forge-gold/40 text-sm font-semibold text-forge-gold disabled:opacity-50"
              >
                {importing ? "Importing…" : "Import workout CSV"}
              </button>
            </>
          )}

          {message && (
            <p className="text-sm text-forge-success" role="status">
              {message}
            </p>
          )}
          {error && (
            <p className="text-sm text-forge-coral" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
