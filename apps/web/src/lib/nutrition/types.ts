import type { MacroTotals } from "@forgefit/nutrition-core";
import type { NutritionTargets } from "@forgefit/program-engine";

export interface NutritionLogRow {
  id: string;
  clientId: string;
  loggedDate: string;
  mealType: string | null;
  foodName: string;
  foodSource: string;
  brand: string | null;
  servingDescription: string;
  quantity: number;
  servingGrams: number;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
}

export interface DailyNutritionSummary {
  date: string;
  targets: NutritionTargets | null;
  totals: MacroTotals;
  entries: NutritionLogRow[];
}

/** Deduplicated macro entry for quick-log recents */
export interface MacroQuickEntry {
  foodName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}
