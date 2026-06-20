"use client";

import type { MacroTotals } from "@forgefit/nutrition-core";
import { postMacroLogEntry } from "@/lib/nutrition/log-entry";
import type { NutritionTargets } from "@forgefit/program-engine";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import type { SaveMealDraft } from "./save-meal-sheet";

interface QuickMacroLogProps {
  loggedDate: string;
  totals: MacroTotals;
  targets: NutritionTargets | null;
  initialValues?: Partial<SaveMealDraft>;
  onSaveMeal?: (draft: SaveMealDraft) => void;
}

const inputClass =
  "min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-forge-surface px-3 text-base tabular-nums text-forge-text outline-none focus:border-forge-ember";

const MACRO_FIELDS = [
  { key: "calories" as const, label: "Cal", unit: "", step: "1", color: "text-forge-ember" },
  { key: "proteinG" as const, label: "Protein", unit: "g", step: "0.1", color: "text-forge-coral" },
  { key: "carbsG" as const, label: "Carbs", unit: "g", step: "0.1", color: "text-forge-gold" },
  { key: "fatG" as const, label: "Fat", unit: "g", step: "0.1", color: "text-forge-steel" },
];

function formatRemaining(current: number, target: number | null): string | null {
  if (target == null || target <= 0) return null;
  const left = Math.round(target - current);
  if (left <= 0) return "At target";
  return `${left} left`;
}

function buildDraft(
  name: string,
  calories: string,
  proteinG: string,
  carbsG: string,
  fatG: string
): SaveMealDraft | null {
  const caloriesNum = calories === "" ? 0 : Number(calories);
  const proteinNum = proteinG === "" ? 0 : Number(proteinG);
  const carbsNum = carbsG === "" ? 0 : Number(carbsG);
  const fatNum = fatG === "" ? 0 : Number(fatG);

  if (
    !Number.isFinite(caloriesNum) ||
    !Number.isFinite(proteinNum) ||
    !Number.isFinite(carbsNum) ||
    !Number.isFinite(fatNum)
  ) {
    return null;
  }

  if (caloriesNum === 0 && proteinNum === 0 && carbsNum === 0 && fatNum === 0) {
    return null;
  }

  return {
    name: name.trim() || "Quick entry",
    calories: caloriesNum,
    proteinG: proteinNum,
    carbsG: carbsNum,
    fatG: fatNum,
  };
}

export function QuickMacroLog({
  loggedDate,
  totals,
  targets,
  initialValues,
  onSaveMeal,
}: QuickMacroLogProps) {
  const router = useRouter();
  const formId = useId();
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setters = {
    calories: setCalories,
    proteinG: setProteinG,
    carbsG: setCarbsG,
    fatG: setFatG,
  };
  const values = { calories, proteinG, carbsG, fatG };

  const targetMap = {
    calories: targets?.calories ?? null,
    proteinG: targets?.proteinG ?? null,
    carbsG: targets?.carbsG ?? null,
    fatG: targets?.fatG ?? null,
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const draft = buildDraft(name, calories, proteinG, carbsG, fatG);
    if (!draft) {
      setError("Enter at least one macro value.");
      return;
    }

    setSubmitting(true);
    try {
      await postMacroLogEntry({
        foodName: draft.name,
        calories: draft.calories,
        proteinG: draft.proteinG,
        carbsG: draft.carbsG,
        fatG: draft.fatG,
        loggedDate,
      });

      setName("");
      setCalories("");
      setProteinG("");
      setCarbsG("");
      setFatG("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log entry.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSaveMeal() {
    const draft = buildDraft(name, calories, proteinG, carbsG, fatG);
    if (!draft) {
      setError("Enter macros before saving to My Meals.");
      return;
    }
    setError(null);
    onSaveMeal?.(draft);
  }

  return (
    <form
      id={formId}
      onSubmit={(e) => void handleSubmit(e)}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {MACRO_FIELDS.map((field) => {
          const currentTotal = totals[field.key];
          const target = targetMap[field.key];
          const remaining = formatRemaining(currentTotal, target);

          return (
            <label key={field.key} className="block">
              <div className="mb-1 flex items-baseline justify-between gap-1">
                <span className={`text-xs font-semibold ${field.color}`}>
                  {field.label}
                  {field.unit ? ` (${field.unit})` : ""}
                </span>
                {remaining && (
                  <span className="text-[10px] font-medium text-forge-muted">
                    {remaining}
                  </span>
                )}
              </div>
              <input
                type="number"
                inputMode={field.key === "calories" ? "numeric" : "decimal"}
                min={0}
                step={field.step}
                value={values[field.key]}
                onChange={(e) => setters[field.key](e.target.value)}
                placeholder="0"
                className={inputClass}
                aria-label={field.label}
              />
            </label>
          );
        })}
      </div>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Label optional (e.g. Lunch, Shake)"
        className={inputClass}
      />

      {error && (
        <p className="text-sm text-forge-coral" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="flex min-h-[52px] flex-1 items-center justify-center rounded-xl bg-forge-ember font-display text-sm font-bold text-white disabled:opacity-60"
        >
          {submitting ? "Logging…" : "Log macros"}
        </button>
        {onSaveMeal && (
          <button
            type="button"
            onClick={handleSaveMeal}
            className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-forge-surface font-display text-sm font-semibold text-forge-text transition-colors hover:border-forge-ember/40 hover:text-forge-ember"
          >
            <BookmarkIcon />
            Save meal
          </button>
        )}
      </div>
    </form>
  );
}

function BookmarkIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}
