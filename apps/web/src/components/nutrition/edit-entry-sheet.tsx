"use client";

import { MealTypePicker } from "@/components/nutrition/meal-type-picker";
import { patchMacroLogEntry } from "@/lib/nutrition/log-entry";
import {
  defaultMealTypeForTime,
  isMealType,
  type MealType,
} from "@/lib/nutrition/meal-types";
import type { NutritionLogRow } from "@/lib/nutrition/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface EditEntrySheetProps {
  open: boolean;
  entry: NutritionLogRow | null;
  onClose: () => void;
}

const inputClass =
  "min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-forge-surface px-3 text-base tabular-nums text-forge-text outline-none focus:border-forge-ember";

export function EditEntrySheet({ open, entry, onClose }: EditEntrySheetProps) {
  const router = useRouter();
  const [foodName, setFoodName] = useState("");
  const [mealType, setMealType] = useState<MealType>(defaultMealTypeForTime());
  const [calories, setCalories] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [carbsG, setCarbsG] = useState("");
  const [fatG, setFatG] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !entry) return;
    setFoodName(entry.foodName);
    setMealType(
      isMealType(entry.mealType) ? entry.mealType : defaultMealTypeForTime()
    );
    setCalories(String(Math.round(entry.calories)));
    setProteinG(String(entry.proteinG));
    setCarbsG(String(entry.carbsG));
    setFatG(String(entry.fatG));
    setError(null);
  }, [open, entry]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open || !entry) return null;

  async function handleSave() {
    const trimmedName = foodName.trim();
    if (!trimmedName) {
      setError("Enter a name for this entry.");
      return;
    }

    const caloriesNum = Number(calories);
    const proteinNum = Number(proteinG);
    const carbsNum = Number(carbsG);
    const fatNum = Number(fatG);

    if (
      !Number.isFinite(caloriesNum) ||
      !Number.isFinite(proteinNum) ||
      !Number.isFinite(carbsNum) ||
      !Number.isFinite(fatNum)
    ) {
      setError("Enter valid macro numbers.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await patchMacroLogEntry(entry!.id, {
        foodName: trimmedName,
        mealType,
        calories: caloriesNum,
        proteinG: proteinNum,
        carbsG: carbsNum,
        fatG: fatNum,
      });
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-label="Edit entry"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-[var(--border)] bg-forge-surface-raised shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3">
          <div className="h-1 w-10 rounded-full bg-forge-muted/40" />
        </div>

        <div className="overflow-y-auto px-5 pb-4 pt-3">
          <h2 className="font-display text-xl font-bold text-forge-text">
            Edit entry
          </h2>
          <p className="mt-1 text-sm text-forge-muted">
            Fix macros, rename, or move to a different meal.
          </p>

          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-forge-muted">
                Meal
              </span>
              <MealTypePicker value={mealType} onChange={setMealType} />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-forge-muted">
                Name
              </span>
              <input
                type="text"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                className={inputClass}
              />
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              <MacroField label="Calories" value={calories} onChange={setCalories} />
              <MacroField label="Protein (g)" value={proteinG} onChange={setProteinG} />
              <MacroField label="Carbs (g)" value={carbsG} onChange={setCarbsG} />
              <MacroField label="Fat (g)" value={fatG} onChange={setFatG} />
            </div>
          </div>

          {error && (
            <p className="mt-4 text-sm text-forge-coral" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="shrink-0 border-t border-[var(--border)] p-4">
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleSave()}
            className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-forge-ember font-display text-sm font-bold text-white disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 min-h-[44px] w-full text-sm font-medium text-forge-muted"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function MacroField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-forge-muted">
        {label}
      </span>
      <input
        type="number"
        min={0}
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </label>
  );
}
