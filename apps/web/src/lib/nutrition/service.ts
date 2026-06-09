import { sumMacros, type MacroTotals } from "@forgefit/nutrition-core";
import type { NutritionTargets } from "@forgefit/program-engine";
import { createClient } from "@/lib/supabase/server";
import { getActiveProgram } from "@/lib/programs/service";
import type { DailyNutritionSummary, NutritionLogRow } from "./types";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function mapRow(row: Record<string, unknown>): NutritionLogRow {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    loggedDate: row.logged_date as string,
    mealType: (row.meal_type as string | null) ?? null,
    foodName: row.food_name as string,
    foodSource: row.food_source as string,
    brand: (row.brand as string | null) ?? null,
    servingDescription: row.serving_description as string,
    quantity: Number(row.quantity),
    servingGrams: Number(row.serving_grams),
    calories: Number(row.calories),
    proteinG: Number(row.protein_g),
    fatG: Number(row.fat_g),
    carbsG: Number(row.carbs_g),
  };
}

export async function getDailyNutritionSummary(
  userId: string,
  date = todayIsoDate()
): Promise<DailyNutritionSummary> {
  const supabase = await createClient();

  const [{ data: rows, error }, targets] = await Promise.all([
    supabase
      .from("nutrition_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("logged_date", date)
      .order("created_at", { ascending: true }),
    getActiveProgram(userId).then((plan) => plan?.nutrition ?? null),
  ]);

  if (error) {
    return {
      date,
      targets,
      totals: { calories: 0, proteinG: 0, fatG: 0, carbsG: 0 },
      entries: [],
    };
  }

  const entries = (rows ?? []).map(mapRow);
  const totals = sumMacros(
    entries.map((entry) => ({
      calories: entry.calories,
      proteinG: entry.proteinG,
      fatG: entry.fatG,
      carbsG: entry.carbsG,
    }))
  );

  return { date, targets, totals, entries };
}

export function emptyTotals(): MacroTotals {
  return { calories: 0, proteinG: 0, fatG: 0, carbsG: 0 };
}
