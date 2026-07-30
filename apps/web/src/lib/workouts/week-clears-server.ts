import { createClient } from "@/lib/supabase/server";
import { hasFeature } from "@/lib/billing/gates";
import { getSubscriptionForUser } from "@/lib/billing/subscription";

export interface ProgramWeekClearRecord {
  id: string;
  weekStartIso: string;
  programId?: string;
  createdAt: string;
}

export async function listProgramWeekClearsForUser(
  userId: string
): Promise<{ clears: ProgramWeekClearRecord[]; tableReady: boolean }> {
  const subscription = await getSubscriptionForUser(userId);
  if (!hasFeature(subscription, "custom_workouts")) {
    return { clears: [], tableReady: true };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_program_week_clears")
    .select("id, week_start_date, program_id, created_at")
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
      programId: row.program_id ? String(row.program_id) : undefined,
      createdAt: String(row.created_at),
    })),
  };
}

export async function upsertProgramWeekClear(input: {
  userId: string;
  weekStartIso: string;
  programId?: string;
}): Promise<ProgramWeekClearRecord> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("user_program_week_clears")
    .upsert(
      {
        user_id: input.userId,
        week_start_date: input.weekStartIso,
        program_id: input.programId ?? null,
        created_at: now,
      },
      { onConflict: "user_id,week_start_date" }
    )
    .select("id, week_start_date, program_id, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: String(data.id),
    weekStartIso: String(data.week_start_date),
    programId: data.program_id ? String(data.program_id) : undefined,
    createdAt: String(data.created_at),
  };
}

export async function deleteProgramWeekClear(input: {
  userId: string;
  weekStartIso: string;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("user_program_week_clears")
    .delete()
    .eq("user_id", input.userId)
    .eq("week_start_date", input.weekStartIso);

  if (error) {
    throw new Error(error.message);
  }
}
