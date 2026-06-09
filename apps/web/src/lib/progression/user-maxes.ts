import { createClient } from "@/lib/supabase/server";
import { ONE_REP_MAX_EXERCISE_IDS } from "./one-rep-max-lifts";

export interface UserOneRepMaxRow {
  exerciseId: string;
  weightKg: number;
  updatedAt: string;
}

export interface UserOneRepMaxesResult {
  rows: UserOneRepMaxRow[];
  tableReady: boolean;
}

function isTableMissing(error: { message?: string; code?: string }): boolean {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "PGRST205" ||
    message.includes("user_one_rep_maxes") ||
    message.includes("schema cache")
  );
}

export async function getUserOneRepMaxes(
  userId: string
): Promise<UserOneRepMaxesResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_one_rep_maxes")
    .select("exercise_id, weight_kg, updated_at")
    .eq("user_id", userId)
    .in("exercise_id", ONE_REP_MAX_EXERCISE_IDS);

  if (error) {
    return { rows: [], tableReady: !isTableMissing(error) };
  }

  return {
    tableReady: true,
    rows: (data ?? []).map((row) => ({
      exerciseId: row.exercise_id as string,
      weightKg: Number(row.weight_kg),
      updatedAt: row.updated_at as string,
    })),
  };
}

export function userOneRepMaxMap(
  rows: UserOneRepMaxRow[]
): Map<string, number> {
  return new Map(rows.map((row) => [row.exerciseId, row.weightKg]));
}
