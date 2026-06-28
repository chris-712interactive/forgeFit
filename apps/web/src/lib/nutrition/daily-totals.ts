import { createClient } from "@/lib/supabase/server";

export interface DailyNutritionTotalsRow {
  date: string;
  calories: number;
  proteinG: number;
}

export async function loadNutritionDailyTotals(
  userId: string,
  cutoffIso: string | null
): Promise<DailyNutritionTotalsRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("nutrition_logs")
    .select("logged_date, calories, protein_g")
    .eq("user_id", userId);

  if (cutoffIso) {
    query = query.gte("logged_date", cutoffIso);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const byDate = new Map<string, { calories: number; proteinG: number }>();
  for (const row of data) {
    const date = row.logged_date as string;
    const entry = byDate.get(date) ?? { calories: 0, proteinG: 0 };
    entry.calories += Number(row.calories);
    entry.proteinG += Number(row.protein_g);
    byDate.set(date, entry);
  }

  return [...byDate.entries()].map(([date, totals]) => ({
    date,
    ...totals,
  }));
}
