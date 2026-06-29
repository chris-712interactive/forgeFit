"use client";

import {
  MEAL_TYPES,
  MEAL_TYPE_LABELS,
  persistPreferredMealType,
  type MealType,
} from "@/lib/nutrition/meal-types";

interface MealTypePickerProps {
  value: MealType;
  onChange: (mealType: MealType) => void;
  compact?: boolean;
}

export function MealTypePicker({
  value,
  onChange,
  compact = false,
}: MealTypePickerProps) {
  return (
    <div
      className={
        compact
          ? "flex flex-wrap gap-1.5"
          : "grid grid-cols-2 gap-2 sm:grid-cols-4"
      }
      role="radiogroup"
      aria-label="Meal"
    >
      {MEAL_TYPES.map((mealType) => {
        const selected = value === mealType;
        return (
          <button
            key={mealType}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => {
              onChange(mealType);
              persistPreferredMealType(mealType);
            }}
            className={
              compact
                ? `rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    selected
                      ? "bg-forge-ember text-white"
                      : "border border-[var(--border)] bg-forge-surface text-forge-muted hover:text-forge-text"
                  }`
                : `min-h-[44px] rounded-xl border px-3 text-sm font-semibold transition-colors ${
                    selected
                      ? "border-forge-ember bg-forge-ember/10 text-forge-ember"
                      : "border-[var(--border)] bg-forge-surface text-forge-muted hover:border-forge-ember/40 hover:text-forge-text"
                  }`
            }
          >
            {MEAL_TYPE_LABELS[mealType]}
          </button>
        );
      })}
    </div>
  );
}
