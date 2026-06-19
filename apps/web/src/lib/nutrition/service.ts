import { sumMacros, type MacroTotals } from "@forgefit/nutrition-core";
import type { NutritionTargets } from "@forgefit/program-engine";
import {
  addDaysIso,
  todayLocalIsoDate,
  yesterdayLocalIsoDate,
} from "@/lib/datetime/local-date";
import { getUserTimeZone } from "@/lib/datetime/timezone";
import { createClient } from "@/lib/supabase/server";
import { getActiveProgram } from "@/lib/programs/service";
import type {
  DailyNutritionSummary,
  MacroQuickEntry,
  NutritionLogRow,
} from "./types";

export async function todayIsoDate(): Promise<string> {
  const timeZone = await getUserTimeZone();
  return todayLocalIsoDate(new Date(), timeZone);
}

export async function yesterdayIsoDate(reference = new Date()): Promise<string> {
  const timeZone = await getUserTimeZone();
  return yesterdayLocalIsoDate(reference, timeZone);
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
  date?: string
): Promise<DailyNutritionSummary> {
  const resolvedDate = date ?? (await todayIsoDate());
  const supabase = await createClient();

  const [{ data: rows, error }, targets] = await Promise.all([
    supabase
      .from("nutrition_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("logged_date", resolvedDate)
      .order("created_at", { ascending: true }),
    getActiveProgram(userId).then((plan) => plan?.nutrition ?? null),
  ]);

  if (error) {
    return {
      date: resolvedDate,
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

  return { date: resolvedDate, targets, totals, entries };
}

export function emptyTotals(): MacroTotals {
  return { calories: 0, proteinG: 0, fatG: 0, carbsG: 0 };
}

export async function getDayLogCount(
  userId: string,
  date: string
): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("nutrition_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("logged_date", date);

  if (error) return 0;
  return count ?? 0;
}

export async function getRecentMacroEntries(
  userId: string,
  limit = 8
): Promise<MacroQuickEntry[]> {
  const supabase = await createClient();
  const timeZone = await getUserTimeZone();
  const sinceDate = addDaysIso(todayLocalIsoDate(new Date(), timeZone), -30);

  const { data, error } = await supabase
    .from("nutrition_logs")
    .select("food_name, calories, protein_g, fat_g, carbs_g, created_at")
    .eq("user_id", userId)
    .gte("logged_date", sinceDate)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error || !data) return [];

  const seen = new Set<string>();
  const recent: MacroQuickEntry[] = [];

  for (const row of data) {
    const calories = Number(row.calories);
    const proteinG = Number(row.protein_g);
    const key = `${row.food_name}|${calories}|${proteinG}`;
    if (seen.has(key)) continue;
    seen.add(key);
    recent.push({
      foodName: row.food_name as string,
      calories,
      proteinG,
      carbsG: Number(row.carbs_g),
      fatG: Number(row.fat_g),
    });
    if (recent.length >= limit) break;
  }

  return recent;
}
