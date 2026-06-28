import { todayIsoDate } from "@/lib/nutrition/service";
import { createClient } from "@/lib/supabase/server";
import type { FitnessGoal } from "@/lib/types/profile";
import {
  buildWeighInReminder,
  type WeighInReminder,
} from "./weigh-in-reminder";

export async function getLastWeighInDate(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("body_measurements")
    .select("measured_date")
    .eq("user_id", userId)
    .not("weight_kg", "is", null)
    .order("measured_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data?.measured_date) {
    return null;
  }

  return data.measured_date as string;
}

export async function getWeighInReminderForUser(
  userId: string,
  goal: FitnessGoal | null
): Promise<WeighInReminder | null> {
  if (!goal) {
    return null;
  }

  const [today, lastWeighInDate] = await Promise.all([
    todayIsoDate(),
    getLastWeighInDate(userId),
  ]);

  return buildWeighInReminder({
    goal,
    lastWeighInDate,
    todayIso: today,
  });
}
