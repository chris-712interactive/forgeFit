import type { MacroTotals } from "@forgefit/nutrition-core";
import type { NutritionTargets } from "@forgefit/program-engine";
import { MEAL_TYPES, type MealType } from "./meal-types";

/** Soft per-meal share of daily targets (sums to 1). */
export const MEAL_BUDGET_SHARES: Record<MealType, number> = {
  breakfast: 0.25,
  lunch: 0.3,
  snack: 0.1,
  dinner: 0.35,
};

export interface MealBudget extends MacroTotals {
  mealType: MealType;
}

export function computeMealBudgets(
  targets: NutritionTargets | null
): MealBudget[] | null {
  if (!targets) return null;

  return MEAL_TYPES.map((mealType) => ({
    mealType,
    calories: roundTarget(targets.calories, MEAL_BUDGET_SHARES[mealType]),
    proteinG: roundTarget(targets.proteinG, MEAL_BUDGET_SHARES[mealType]),
    carbsG: roundTarget(targets.carbsG, MEAL_BUDGET_SHARES[mealType]),
    fatG: roundTarget(targets.fatG, MEAL_BUDGET_SHARES[mealType]),
  }));
}

export function getMealBudget(
  budgets: MealBudget[] | null,
  mealType: MealType | null
): MealBudget | null {
  if (!budgets || !mealType) return null;
  return budgets.find((budget) => budget.mealType === mealType) ?? null;
}

function roundTarget(value: number | null | undefined, share: number): number {
  if (value == null || value <= 0) return 0;
  return Math.round(value * share);
}
