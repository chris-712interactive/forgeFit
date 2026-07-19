"use client";

import {
  adjustServingCount,
  cloneLineItems,
  formatLineItemPortion,
  formatQuantity,
  rescaleLineItem,
  scaleLineItems,
  sumLineItems,
  type MealLineItem,
  type MacroTotals,
} from "@forgefit/nutrition-core";
import { MealTypePicker } from "@/components/nutrition/meal-type-picker";
import { patchMacroLogEntry } from "@/lib/nutrition/log-entry";
import {
  defaultMealTypeForTime,
  isMealType,
  type MealType,
} from "@/lib/nutrition/meal-types";
import type { NutritionLogRow } from "@/lib/nutrition/types";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MealQuantityStepper } from "./meal-quantity-stepper";

interface EditEntrySheetProps {
  open: boolean;
  entry: NutritionLogRow | null;
  onClose: () => void;
}

const inputClass =
  "min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-forge-surface px-3 text-base tabular-nums text-forge-text outline-none focus:border-forge-ember";

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function scaleMacroTotals(base: MacroTotals, servings: number): MacroTotals {
  return {
    calories: Math.round(base.calories * servings),
    proteinG: round1(base.proteinG * servings),
    carbsG: round1(base.carbsG * servings),
    fatG: round1(base.fatG * servings),
  };
}

export function EditEntrySheet({ open, entry, onClose }: EditEntrySheetProps) {
  const router = useRouter();
  const [foodName, setFoodName] = useState("");
  const [mealType, setMealType] = useState<MealType>(defaultMealTypeForTime());
  const [lineItems, setLineItems] = useState<MealLineItem[]>([]);
  const [perServingBase, setPerServingBase] = useState<MealLineItem[]>([]);
  const [servings, setServings] = useState(1);
  const [macroOnlyBase, setMacroOnlyBase] = useState<MacroTotals | null>(null);
  const [calories, setCalories] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [carbsG, setCarbsG] = useState("");
  const [fatG, setFatG] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasItems = (entry?.lineItems?.length ?? 0) > 0;

  useEffect(() => {
    if (!open || !entry) return;
    setFoodName(entry.foodName);
    setMealType(
      isMealType(entry.mealType) ? entry.mealType : defaultMealTypeForTime()
    );
    setError(null);

    const loggedServings = Math.max(
      1,
      Math.round(entry.servingsLogged ?? entry.quantity ?? 1)
    );

    if (entry.lineItems && entry.lineItems.length > 0) {
      const current = cloneLineItems(entry.lineItems);
      const base =
        loggedServings > 1
          ? cloneLineItems(scaleLineItems(current, 1 / loggedServings))
          : cloneLineItems(current);
      setPerServingBase(base);
      setLineItems(current);
      setServings(loggedServings);
      setMacroOnlyBase(null);
      setCalories("");
      setProteinG("");
      setCarbsG("");
      setFatG("");
    } else {
      const base: MacroTotals = {
        calories: entry.calories / loggedServings,
        proteinG: entry.proteinG / loggedServings,
        carbsG: entry.carbsG / loggedServings,
        fatG: entry.fatG / loggedServings,
      };
      setMacroOnlyBase(base);
      setPerServingBase([]);
      setLineItems([]);
      setServings(loggedServings);
      setCalories(String(Math.round(entry.calories)));
      setProteinG(String(entry.proteinG));
      setCarbsG(String(entry.carbsG));
      setFatG(String(entry.fatG));
    }
  }, [open, entry]);

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

  if (!open || !entry) return null;

  function applyServings(next: number) {
    if (next <= 0) return;
    setServings(next);
    if (hasItems && perServingBase.length > 0) {
      setLineItems(cloneLineItems(scaleLineItems(perServingBase, next)));
      return;
    }
    if (macroOnlyBase) {
      const scaled = scaleMacroTotals(macroOnlyBase, next);
      setCalories(String(scaled.calories));
      setProteinG(String(scaled.proteinG));
      setCarbsG(String(scaled.carbsG));
      setFatG(String(scaled.fatG));
    }
  }

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

  async function handleSave() {
    const trimmedName = foodName.trim();
    if (!trimmedName) {
      setError("Enter a name for this entry.");
      return;
    }

    if (
      !Number.isFinite(totals.calories) ||
      !Number.isFinite(totals.proteinG) ||
      !Number.isFinite(totals.carbsG) ||
      !Number.isFinite(totals.fatG)
    ) {
      setError("Enter valid macro numbers.");
      return;
    }

    if (hasItems && lineItems.length === 0) {
      setError("Keep at least one ingredient, or remove this entry.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const servingDesc =
        servings === 1
          ? entry!.servingDescription || "1 serving"
          : `${formatQuantity(servings)} servings`;

      await patchMacroLogEntry(entry!.id, {
        foodName: trimmedName,
        mealType,
        calories: totals.calories,
        proteinG: totals.proteinG,
        carbsG: totals.carbsG,
        fatG: totals.fatG,
        quantity: servings,
        servingDescription: servingDesc,
        lineItems: hasItems ? lineItems : null,
        servingsLogged: servings,
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
            Change servings or ingredient amounts — macros update automatically.
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

            <div className="flex items-center justify-between gap-3 rounded-xl border border-forge-ember/40 bg-forge-surface px-3 py-3">
              <div>
                <p className="text-sm font-semibold text-forge-text">
                  Servings logged
                </p>
                <p className="text-xs text-forge-muted">
                  {hasItems
                    ? "Scales all ingredients together"
                    : "Multiplies this entry’s macros"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-[var(--border)] bg-forge-surface-raised">
                <button
                  type="button"
                  onClick={() => applyServings(adjustServingCount(servings, -1))}
                  className="flex h-11 w-11 items-center justify-center text-lg text-forge-muted hover:text-forge-text"
                  aria-label="Decrease servings"
                >
                  −
                </button>
                <span className="min-w-[2.5rem] text-center text-base font-bold tabular-nums text-forge-text">
                  {formatQuantity(servings)}
                </span>
                <button
                  type="button"
                  onClick={() => applyServings(adjustServingCount(servings, 1))}
                  className="flex h-11 w-11 items-center justify-center text-lg text-forge-muted hover:text-forge-text"
                  aria-label="Increase servings"
                >
                  +
                </button>
              </div>
            </div>

            {hasItems ? (
              <ul className="space-y-2">
                <li className="px-0.5 text-xs font-semibold uppercase tracking-wider text-forge-muted">
                  Ingredients
                </li>
                {lineItems.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-[var(--border)] bg-forge-surface p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-forge-text">
                          {item.foodName}
                        </p>
                        <p className="text-xs text-forge-muted">
                          {formatLineItemPortion(item.foodId, item.quantity)} ·{" "}
                          {item.calories} kcal
                        </p>
                      </div>
                      <MealQuantityStepper
                        foodId={item.foodId}
                        value={item.quantity}
                        onChange={(q) => updateQuantity(item.id, q)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <MacroField label="Calories" value={calories} onChange={setCalories} />
                <MacroField label="Protein (g)" value={proteinG} onChange={setProteinG} />
                <MacroField label="Carbs (g)" value={carbsG} onChange={setCarbsG} />
                <MacroField label="Fat (g)" value={fatG} onChange={setFatG} />
              </div>
            )}

            <div className="rounded-xl border border-[var(--border)] bg-forge-surface px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-forge-muted">
                Updated total
              </p>
              <p className="font-display text-base font-bold text-forge-text">
                {Math.round(totals.calories)} kcal · P {totals.proteinG}g · C{" "}
                {totals.carbsG}g · F {totals.fatG}g
              </p>
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
            disabled={submitting || (hasItems && lineItems.length === 0)}
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
