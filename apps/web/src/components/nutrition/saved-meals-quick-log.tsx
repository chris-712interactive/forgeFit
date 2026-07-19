"use client";

import {
  formatMacroLine,
  getPerServingTotals,
  loadSavedMeals,
  type SavedMeal,
} from "@/lib/nutrition/saved-meals";
import { useEffect, useMemo, useState } from "react";
import { LogMealSheet } from "./log-meal-sheet";

interface SavedMealsQuickLogProps {
  loggedDate: string;
  refreshKey?: number;
}

export function SavedMealsQuickLog({
  loggedDate,
  refreshKey = 0,
}: SavedMealsQuickLogProps) {
  const [meals, setMeals] = useState<SavedMeal[]>([]);
  const [logMeal, setLogMeal] = useState<SavedMeal | null>(null);

  useEffect(() => {
    setMeals(loadSavedMeals());
  }, [refreshKey]);

  const quickMeals = useMemo(
    () => meals.slice(0, 8),
    [meals]
  );

  if (quickMeals.length === 0) return null;

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-forge-muted">
          Saved meals — adjust before logging
        </h3>
        <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {quickMeals.map((meal) => {
            const display = getPerServingTotals(meal);
            return (
              <button
                key={meal.id}
                type="button"
                onClick={() => setLogMeal(meal)}
                className="w-[168px] shrink-0 snap-start rounded-xl border border-[var(--border)] bg-forge-surface p-3 text-left transition-colors hover:border-forge-ember/40"
              >
                <p className="truncate font-medium text-sm text-forge-text">
                  {meal.name}
                </p>
                <p className="mt-1 truncate text-xs text-forge-muted">
                  {formatMacroLine(display)}
                  {meal.servings > 1 ? " / serving" : ""}
                </p>
                <p className="mt-2 text-xs font-semibold text-forge-ember">
                  Adjust & log →
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <LogMealSheet
        open={logMeal != null}
        meal={logMeal}
        loggedDate={loggedDate}
        onClose={() => setLogMeal(null)}
      />
    </section>
  );
}
