import { sumMacros, type MacroTotals } from "@forgefit/nutrition-core";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export function isMealType(value: string | null | undefined): value is MealType {
  return value != null && MEAL_TYPES.includes(value as MealType);
}

/** Infer meal slot from local time when the user does not pick one. */
export function defaultMealTypeForTime(date = new Date()): MealType {
  const hour = date.getHours();
  if (hour < 11) return "breakfast";
  if (hour < 15) return "lunch";
  if (hour < 17) return "snack";
  return "dinner";
}

export function mealTypeLabel(mealType: string | null | undefined): string {
  if (isMealType(mealType)) return MEAL_TYPE_LABELS[mealType];
  return "Other";
}

const PREFERRED_MEAL_TYPE_KEY = "forgefit:preferred-meal-type";

/** Last meal slot the user picked, or time-of-day default. */
export function getPreferredMealType(): MealType {
  if (typeof window === "undefined") return defaultMealTypeForTime();
  try {
    const stored = localStorage.getItem(PREFERRED_MEAL_TYPE_KEY);
    if (isMealType(stored)) return stored;
  } catch {
    /* ignore */
  }
  return defaultMealTypeForTime();
}

export function persistPreferredMealType(mealType: MealType): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFERRED_MEAL_TYPE_KEY, mealType);
  } catch {
    /* ignore */
  }
}

export function resolveMealType(mealType?: MealType): MealType {
  return mealType ?? getPreferredMealType();
}

export interface MealEntryGroup<T> {
  mealType: MealType | null;
  label: string;
  entries: T[];
  totals: MacroTotals;
}

export function groupEntriesByMeal<
  T extends {
    mealType: string | null;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  },
>(entries: T[]): MealEntryGroup<T>[] {
  const buckets = new Map<MealType | null, T[]>();

  for (const entry of entries) {
    const key = isMealType(entry.mealType) ? entry.mealType : null;
    const list = buckets.get(key) ?? [];
    list.push(entry);
    buckets.set(key, list);
  }

  const groups: MealEntryGroup<T>[] = [];

  for (const mealType of MEAL_TYPES) {
    const mealEntries = buckets.get(mealType);
    if (!mealEntries?.length) continue;
    groups.push({
      mealType,
      label: MEAL_TYPE_LABELS[mealType],
      entries: mealEntries,
      totals: sumMacros(mealEntries),
    });
  }

  const unassigned = buckets.get(null);
  if (unassigned?.length) {
    groups.push({
      mealType: null,
      label: "Other",
      entries: unassigned,
      totals: sumMacros(unassigned),
    });
  }

  return groups;
}
