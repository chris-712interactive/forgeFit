import { createClient } from "@/lib/supabase/server";
import { hasFeature } from "@/lib/billing/gates";
import { getSubscriptionForUser } from "@/lib/billing/subscription";

export async function listClearedProgramWeeksForUser(
  userId: string
): Promise<{ weekStarts: string[]; tableReady: boolean }> {
  const subscription = await getSubscriptionForUser(userId);
  if (!hasFeature(subscription, "custom_workouts")) {
    return { weekStarts: [], tableReady: true };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_workout_week_program_clears")
    .select("week_start_date")
    .eq("user_id", userId)
    .order("week_start_date", { ascending: false });

  if (error) {
    const missing = error.message
      .toLowerCase()
      .includes("user_workout_week_program_clears");
    return { weekStarts: [], tableReady: !missing };
  }

  return {
    tableReady: true,
    weekStarts: (data ?? []).map((row) => String(row.week_start_date)),
  };
}
