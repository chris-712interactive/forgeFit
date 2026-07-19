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
import { postMacroLogEntry } from "@/lib/nutrition/log-entry";
import { getPreferredMealType, type MealType } from "@/lib/nutrition/meal-types";
import {
  formatMacroLine,
  formatServingsLabel,
  getPerServingLineItems,
  mealHasLineItems,
  type SavedMeal,
} from "@/lib/nutrition/saved-meals";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MealQuantityStepper } from "./meal-quantity-stepper";

interface LogMealSheetProps {
  open: boolean;
  meal: SavedMeal | null;
  loggedDate: string;
  onClose: () => void;
  /** Pre-fill servings (e.g. re-log starts at last logged amount). */
  initialServings?: number;
}

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

export function LogMealSheet({
  open,
  meal,
  loggedDate,
  onClose,
  initialServings = 1,
}: LogMealSheetProps) {
  const router = useRouter();
  const [lineItems, setLineItems] = useState<MealLineItem[]>([]);
  const [servingsEating, setServingsEating] = useState(1);
  const [macroOnlyBase, setMacroOnlyBase] = useState<MacroTotals | null>(null);
  const [mealType, setMealType] = useState<MealType>(() => getPreferredMealType());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasItems = meal != null && mealHasLineItems(meal);

  const perServingBase = useMemo(() => {
    if (!meal || !hasItems) return [];
    return getPerServingLineItems(meal);
  }, [meal, hasItems]);

  useEffect(() => {
    if (!open || !meal) return;
    const startServings = Math.max(1, Math.round(initialServings));
    if (mealHasLineItems(meal)) {
      setMacroOnlyBase(null);
      setServingsEating(startServings);
      setLineItems(
        cloneLineItems(
          scaleLineItems(getPerServingLineItems(meal), startServings)
        )
      );
    } else {
      const base: MacroTotals = {
        calories: meal.calories,
        proteinG: meal.proteinG,
        carbsG: meal.carbsG,
        fatG: meal.fatG,
      };
      setMacroOnlyBase(base);
      setLineItems([]);
      setServingsEating(startServings);
    }
    setError(null);
    setMealType(getPreferredMealType());
  }, [open, meal, initialServings]);

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
    if (!macroOnlyBase) {
      return { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
    }
    return scaleMacroTotals(macroOnlyBase, servingsEating);
  }, [hasItems, lineItems, macroOnlyBase, servingsEating]);

  if (!open || !meal) return null;

  function applyServingsEating(next: number) {
    if (next <= 0) return;
    setServingsEating(next);
    if (perServingBase.length > 0) {
      setLineItems(cloneLineItems(scaleLineItems(perServingBase, next)));
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

  async function handleLog() {
    if (!meal) return;
    if (totals.calories === 0 && totals.proteinG === 0) {
      setError("Meal has no macros to log.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const servingDesc =
        hasItems && meal.servings > 1
          ? `${formatQuantity(servingsEating)} serving${servingsEating === 1 ? "" : "s"} (recipe: ${formatServingsLabel(meal.servings)})`
          : `${formatQuantity(servingsEating)} serving${servingsEating === 1 ? "" : "s"}`;

      await postMacroLogEntry({
        foodName: meal.name,
        calories: totals.calories,
        proteinG: totals.proteinG,
        carbsG: totals.carbsG,
        fatG: totals.fatG,
        loggedDate,
        mealType,
        servingDescription: servingDesc,
        lineItems: hasItems ? lineItems : undefined,
        servingsLogged: servingsEating,
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
            Change how many you ate — tap +/− on servings or each ingredient.
            Your saved recipe stays unchanged.
          </p>

          {hasItems && meal.servings > 1 && (
            <p className="mt-2 text-xs text-forge-steel">
              Recipe makes {formatServingsLabel(meal.servings)} · per serving:{" "}
              {formatMacroLine(sumLineItems(perServingBase))}
            </p>
          )}

          <div className="mt-4 rounded-xl border border-forge-ember/25 bg-forge-ember/5 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-forge-muted">
              Total for this log
            </p>
            <p className="font-display text-lg font-bold text-forge-text">
              {formatMacroLine(totals)}
            </p>
          </div>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-semibold text-forge-muted">
              Meal
            </span>
            <MealTypePicker value={mealType} onChange={setMealType} compact />
          </label>

          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-forge-ember/40 bg-forge-surface px-3 py-3">
            <div>
              <p className="text-sm font-semibold text-forge-text">
                Servings to log
              </p>
              <p className="text-xs text-forge-muted">
                {hasItems
                  ? "Scales all ingredients together"
                  : "Multiplies this meal’s macros"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-[var(--border)] bg-forge-surface-raised">
              <button
                type="button"
                onClick={() =>
                  applyServingsEating(adjustServingCount(servingsEating, -1))
                }
                className="flex h-11 w-11 items-center justify-center text-lg text-forge-muted hover:text-forge-text"
                aria-label="Decrease servings"
              >
                −
              </button>
              <span className="min-w-[2.5rem] text-center text-base font-bold tabular-nums text-forge-text">
                {formatQuantity(servingsEating)}
              </span>
              <button
                type="button"
                onClick={() =>
                  applyServingsEating(adjustServingCount(servingsEating, 1))
                }
                className="flex h-11 w-11 items-center justify-center text-lg text-forge-muted hover:text-forge-text"
                aria-label="Increase servings"
              >
                +
              </button>
            </div>
          </div>

          {hasItems ? (
            <ul className="mt-4 space-y-2">
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
              {lineItems.length === 0 && (
                <p className="text-sm text-forge-coral">
                  Add at least one ingredient to log.
                </p>
              )}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-forge-muted">
              Per serving: {macroOnlyBase ? formatMacroLine(macroOnlyBase) : "—"}
            </p>
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
            {submitting
              ? "Logging…"
              : servingsEating === 1
                ? "Log to today"
                : `Log ${formatQuantity(servingsEating)} servings`}
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
