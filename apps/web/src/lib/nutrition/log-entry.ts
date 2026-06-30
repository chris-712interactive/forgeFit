import type { FoodSearchResult } from "@forgefit/nutrition-core";
import { scaleMacrosFrom100g } from "@forgefit/nutrition-core";
import { browserTodayIsoDate } from "@/lib/datetime/local-date";
import type { MealType } from "@/lib/nutrition/meal-types";
import {
  getPreferredMealType,
  persistPreferredMealType,
  resolveMealType,
} from "@/lib/nutrition/meal-types";
import type { MealLineItem } from "@forgefit/nutrition-core";

export interface MacroLogInput {
  foodName: string;
  calories: number;
  proteinG: number;
  carbsG?: number;
  fatG?: number;
  /** Defaults to the browser's local calendar day. */
  loggedDate?: string;
  mealType?: MealType;
  servingDescription?: string;
  lineItems?: MealLineItem[];
  servingsLogged?: number;
}

export async function postMacroLogEntry(
  input: MacroLogInput
): Promise<void> {
  const loggedDate = input.loggedDate ?? browserTodayIsoDate();
  const mealType = resolveMealType(input.mealType);
  const response = await fetch("/api/nutrition/logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: crypto.randomUUID(),
      loggedDate,
      mealType,
      foodName: input.foodName.trim(),
      foodSource: "custom",
      servingDescription: input.servingDescription ?? "1 serving",
      quantity: input.servingsLogged ?? 1,
      servingGrams: 1,
      calories: input.calories,
      proteinG: input.proteinG,
      carbsG: input.carbsG ?? 0,
      fatG: input.fatG ?? 0,
      lineItems: input.lineItems,
      servingsLogged: input.servingsLogged,
    }),
  });

  if (!response.ok) {
    const err = (await response.json()) as { error?: string };
    throw new Error(err.error ?? "Could not log entry");
  }

  persistPreferredMealType(mealType);
}

export async function postFoodSearchLogEntry(input: {
  loggedDate: string;
  mealType?: MealType;
  food: FoodSearchResult;
  quantity?: number;
  servingGrams?: number;
}): Promise<void> {
  const mealType = resolveMealType(input.mealType);
  const quantity = input.quantity ?? 1;
  const servingGrams = input.servingGrams ?? 100;
  const scaled = scaleMacrosFrom100g(input.food.per100g, servingGrams * quantity);

  const response = await fetch("/api/nutrition/logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: crypto.randomUUID(),
      loggedDate: input.loggedDate,
      mealType,
      foodName: input.food.name,
      foodSource: input.food.source,
      externalFoodId: input.food.id,
      brand: input.food.brand,
      servingDescription: input.food.servingDescription,
      quantity,
      servingGrams,
      calories: scaled.calories,
      proteinG: scaled.proteinG,
      carbsG: scaled.carbsG,
      fatG: scaled.fatG,
    }),
  });

  if (!response.ok) {
    const err = (await response.json()) as { error?: string };
    throw new Error(err.error ?? "Could not log entry");
  }

  persistPreferredMealType(mealType);
}

export interface MacroLogPatchInput {
  foodName?: string;
  mealType?: MealType | null;
  servingDescription?: string;
  quantity?: number;
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
}

export async function patchMacroLogEntry(
  id: string,
  input: MacroLogPatchInput
): Promise<void> {
  const response = await fetch(`/api/nutrition/logs/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const err = (await response.json()) as { error?: string };
    throw new Error(err.error ?? "Could not update entry");
  }
}
