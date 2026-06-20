"use client";

import type { MacroTotals } from "@forgefit/nutrition-core";
import { postMacroLogEntry } from "@/lib/nutrition/log-entry";
import {
  createPresetId,
  saveMacroPreset,
  type MacroPreset,
} from "@/lib/nutrition/presets";
import type { NutritionTargets } from "@forgefit/program-engine";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

interface QuickMacroLogProps {
  loggedDate: string;
  totals: MacroTotals;
  targets: NutritionTargets | null;
  onApplied?: (preset: MacroPreset) => void;
  initialValues?: Partial<MacroPreset>;
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

export function QuickMacroLog({
  loggedDate,
  totals,
  targets,
  onApplied,
  initialValues,
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
  const [saveAsPreset, setSaveAsPreset] = useState(false);
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

    const caloriesNum = calories === "" ? 0 : Number(calories);
    const proteinNum = proteinG === "" ? 0 : Number(proteinG);
    const carbsNum = carbsG === "" ? 0 : Number(carbsG);
    const fatNum = fatG === "" ? 0 : Number(fatG);

    if (
      !Number.isFinite(caloriesNum) ||
      !Number.isFinite(proteinNum) ||
      !Number.isFinite(carbsNum) ||
      !Number.isFinite(fatNum) ||
      caloriesNum < 0 ||
      proteinNum < 0 ||
      carbsNum < 0 ||
      fatNum < 0
    ) {
      setError("Enter valid numbers (0 or more).");
      return;
    }
    if (caloriesNum === 0 && proteinNum === 0 && carbsNum === 0 && fatNum === 0) {
      setError("Enter at least one macro value.");
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-forge-muted">
          <input
            type="checkbox"
            checked={saveAsPreset}
            onChange={(e) => setSaveAsPreset(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--border)]"
          />
          Save as meal
        </label>
      </div>

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
  );
}
