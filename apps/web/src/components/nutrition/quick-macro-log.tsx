"use client";

import { postMacroLogEntry } from "@/lib/nutrition/log-entry";
import {
  createPresetId,
  saveMacroPreset,
  type MacroPreset,
} from "@/lib/nutrition/presets";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface QuickMacroLogProps {
  loggedDate: string;
  onApplied?: (preset: MacroPreset) => void;
  initialValues?: Partial<MacroPreset>;
  /** Omit outer card shell when nested inside the log hub */
  embedded?: boolean;
}

const inputClass =
  "min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-forge-surface px-4 text-base text-forge-text outline-none focus:border-forge-ember";

export function QuickMacroLog({
  loggedDate,
  onApplied,
  initialValues,
  embedded = false,
}: QuickMacroLogProps) {
  const router = useRouter();
  const [name, setName] = useState(initialValues?.name ?? "");
  const [calories, setCalories] = useState(
    initialValues?.calories != null ? String(initialValues.calories) : ""
  );
  const [proteinG, setProteinG] = useState(
    initialValues?.proteinG != null ? String(initialValues.proteinG) : ""
  );
  const [carbsG, setCarbsG] = useState(
    initialValues?.carbsG != null ? String(initialValues.carbsG) : ""
  );
  const [fatG, setFatG] = useState(
    initialValues?.fatG != null ? String(initialValues.fatG) : ""
  );
  const [showOptional, setShowOptional] = useState(
    Boolean(initialValues?.carbsG || initialValues?.fatG)
  );
  const [saveAsPreset, setSaveAsPreset] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const caloriesNum = Number(calories);
    const proteinNum = Number(proteinG);
    const carbsNum = carbsG === "" ? 0 : Number(carbsG);
    const fatNum = fatG === "" ? 0 : Number(fatG);

    if (!Number.isFinite(caloriesNum) || caloriesNum < 0) {
      setError("Enter calories (0 or more).");
      return;
    }
    if (!Number.isFinite(proteinNum) || proteinNum < 0) {
      setError("Enter protein in grams (0 or more).");
      return;
    }
    if (caloriesNum === 0 && proteinNum === 0) {
      setError("Add at least calories or protein.");
      return;
    }
    if (
      (carbsG !== "" && !Number.isFinite(carbsNum)) ||
      (fatG !== "" && !Number.isFinite(fatNum))
    ) {
      setError("Carbs and fat must be valid numbers.");
      return;
    }

    const label = name.trim() || "Quick entry";

    setSubmitting(true);
    try {
      await postMacroLogEntry({
        foodName: label,
        calories: caloriesNum,
        proteinG: proteinNum,
        carbsG: carbsNum,
        fatG: fatNum,
        loggedDate,
      });

      if (saveAsPreset) {
        const preset: MacroPreset = {
          id: createPresetId(),
          name: label,
          calories: caloriesNum,
          proteinG: proteinNum,
          carbsG: carbsNum,
          fatG: fatNum,
        };
        saveMacroPreset(preset);
        onApplied?.(preset);
      }

      setName("");
      setCalories("");
      setProteinG("");
      setCarbsG("");
      setFatG("");
      setSaveAsPreset(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log entry.");
    } finally {
      setSubmitting(false);
    }
  }

  const content = (
    <>
      {!embedded && (
        <>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
            Quick log
          </h2>
          <p className="mt-1 text-xs text-forge-muted">
            Hit your targets — name optional, calories + protein required
          </p>
        </>
      )}

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className={embedded ? "space-y-3" : "mt-4 space-y-3"}
      >
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Label (e.g. Lunch, Shake)"
          className={inputClass}
        />

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-forge-muted">
              Calories *
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="0"
              className={inputClass}
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-forge-muted">
              Protein (g) *
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.1"
              value={proteinG}
              onChange={(e) => setProteinG(e.target.value)}
              placeholder="0"
              className={inputClass}
              required
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => setShowOptional((open) => !open)}
          className="text-xs font-semibold text-forge-steel hover:text-forge-ember"
        >
          {showOptional ? "Hide carbs & fat" : "Add carbs & fat (optional)"}
        </button>

        {showOptional && (
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-forge-muted">
                Carbs (g)
              </span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.1"
                value={carbsG}
                onChange={(e) => setCarbsG(e.target.value)}
                placeholder="0"
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-forge-muted">
                Fat (g)
              </span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.1"
                value={fatG}
                onChange={(e) => setFatG(e.target.value)}
                placeholder="0"
                className={inputClass}
              />
            </label>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-forge-muted">
          <input
            type="checkbox"
            checked={saveAsPreset}
            onChange={(e) => setSaveAsPreset(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--border)]"
          />
          Save as my preset
        </label>

        {error && (
          <p className="text-sm text-forge-coral" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-forge-ember font-display text-sm font-bold text-white disabled:opacity-60"
        >
          {submitting ? "Logging…" : "Log macros"}
        </button>
      </form>
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <section className="rounded-2xl border border-forge-ember/25 bg-forge-surface-raised p-4 sm:p-5">
      {content}
    </section>
  );
}
