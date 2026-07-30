import { createClient } from "@/lib/supabase/server";
import { hasFeature } from "@/lib/billing/gates";
import { getSubscriptionForUser } from "@/lib/billing/subscription";
import type { ProgramWeekClearView } from "./week-clears-core";

export async function listProgramWeekClearsForUser(
  userId: string
): Promise<{ clears: ProgramWeekClearView[]; tableReady: boolean }> {
  const subscription = await getSubscriptionForUser(userId);
  if (!hasFeature(subscription, "custom_workouts")) {
    return { clears: [], tableReady: true };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_program_week_clears")
    .select("id, week_start_date, program_id")
    .eq("user_id", userId)
    .order("week_start_date", { ascending: false });

  if (error) {
    const missing = error.message
      .toLowerCase()
      .includes("user_program_week_clears");
    return { clears: [], tableReady: !missing };
  }

  return {
    tableReady: true,
    clears: (data ?? []).map((row) => ({
      id: String(row.id),
      weekStartIso: String(row.week_start_date),
      programId: row.program_id ? String(row.program_id) : null,
    })),
  };
}
