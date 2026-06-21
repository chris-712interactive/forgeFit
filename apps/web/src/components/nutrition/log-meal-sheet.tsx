"use client";

import {
  cloneLineItems,
  rescaleLineItem,
  sumLineItems,
  type MealLineItem,
} from "@forgefit/nutrition-core";
import { postMacroLogEntry } from "@/lib/nutrition/log-entry";
import {
  formatMacroLine,
  mealHasLineItems,
  type SavedMeal,
} from "@/lib/nutrition/saved-meals";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface LogMealSheetProps {
  open: boolean;
  meal: SavedMeal | null;
  loggedDate: string;
  onClose: () => void;
}

export function LogMealSheet({
  open,
  meal,
  loggedDate,
  onClose,
}: LogMealSheetProps) {
  const router = useRouter();
  const [lineItems, setLineItems] = useState<MealLineItem[]>([]);
  const [calories, setCalories] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [carbsG, setCarbsG] = useState("");
  const [fatG, setFatG] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasItems = meal != null && mealHasLineItems(meal);

  useEffect(() => {
    if (!open || !meal) return;
    if (mealHasLineItems(meal)) {
      setLineItems(cloneLineItems(meal.lineItems));
    } else {
      setLineItems([]);
      setCalories(String(meal.calories));
      setProteinG(String(meal.proteinG));
      setCarbsG(String(meal.carbsG));
      setFatG(String(meal.fatG));
    }
    setError(null);
  }, [open, meal]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const totals = useMemo(() => {
    if (hasItems) return sumLineItems(lineItems);
    return {
      calories: Number(calories) || 0,
      proteinG: Number(proteinG) || 0,
      carbsG: Number(carbsG) || 0,
      fatG: Number(fatG) || 0,
    };
  }, [hasItems, lineItems, calories, proteinG, carbsG, fatG]);

  if (!open || !meal) return null;

  function updateQuantity(id: string, quantity: number) {
    if (quantity <= 0) {
      setLineItems((items) => items.filter((item) => item.id !== id));
      return;
    }
    setLineItems((items) =>
      items.map((item) =>
        item.id === id ? rescaleLineItem(item, quantity) : item
      )
    );
  }

  async function handleLog() {
    if (!meal) return;
    if (totals.calories === 0 && totals.proteinG === 0) {
      setError("Meal has no macros to log.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await postMacroLogEntry({
        foodName: meal.name,
        calories: totals.calories,
        proteinG: totals.proteinG,
        carbsG: totals.carbsG,
        fatG: totals.fatG,
        loggedDate,
      });
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log meal.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-label={`Log ${meal.name}`}
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
            Log {meal.name}
          </h2>
          <p className="mt-1 text-sm text-forge-muted">
            Adjust portions for today only — your saved meal stays unchanged.
          </p>

          <div className="mt-4 rounded-xl border border-forge-ember/25 bg-forge-ember/5 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-forge-muted">
              Today&apos;s total
            </p>
            <p className="font-display text-lg font-bold text-forge-text">
              {formatMacroLine(totals)}
            </p>
          </div>

          {hasItems ? (
            <ul className="mt-4 space-y-2">
              {lineItems.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-[var(--border)] bg-forge-surface p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-forge-text">
                        {item.foodName}
                      </p>
                      <p className="text-xs text-forge-muted">
                        {item.servingLabel} · {item.calories} kcal
                      </p>
                    </div>
                    <QuantityStepper
                      value={item.quantity}
                      onChange={(q) => updateQuantity(item.id, q)}
                    />
                  </div>
                </li>
              ))}
              {lineItems.length === 0 && (
                <p className="text-sm text-forge-coral">
                  Add at least one ingredient to log.
                </p>
              )}
            </ul>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <MacroField label="Cal" value={calories} onChange={setCalories} />
              <MacroField label="Protein (g)" value={proteinG} onChange={setProteinG} />
              <MacroField label="Carbs (g)" value={carbsG} onChange={setCarbsG} />
              <MacroField label="Fat (g)" value={fatG} onChange={setFatG} />
            </div>
          )}

          {error && (
            <p className="mt-4 text-sm text-forge-coral" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="shrink-0 border-t border-[var(--border)] p-4">
          <button
            type="button"
            disabled={submitting || (hasItems && lineItems.length === 0)}
            onClick={() => void handleLog()}
            className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-forge-ember font-display text-sm font-bold text-white disabled:opacity-50"
          >
            {submitting ? "Logging…" : "Log to today"}
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

function QuantityStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-lg border border-[var(--border)] bg-forge-surface-raised">
      <button
        type="button"
        onClick={() => onChange(Math.round((value - 0.5) * 10) / 10)}
        className="flex h-9 w-9 items-center justify-center text-lg text-forge-muted"
        aria-label="Decrease"
      >
        −
      </button>
      <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums">
        {Number.isInteger(value) ? value : value.toFixed(1)}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.round((value + 0.5) * 10) / 10)}
        className="flex h-9 w-9 items-center justify-center text-lg text-forge-muted"
        aria-label="Increase"
      >
        +
      </button>
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
        className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-forge-surface px-3 text-base tabular-nums text-forge-text outline-none focus:border-forge-ember"
      />
    </label>
  );
}
