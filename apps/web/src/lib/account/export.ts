import type { SupabaseClient } from "@supabase/supabase-js";

export const ACCOUNT_EXPORT_VERSION = "1.0";

export interface AccountExportBundle {
  formatVersion: typeof ACCOUNT_EXPORT_VERSION;
  exportedAt: string;
  account: {
    id: string;
    email: string | null;
  };
  profile: Record<string, unknown> | null;
  equipment: Record<string, unknown>[];
  recoveryEquipment: Record<string, unknown>[];
  programs: Record<string, unknown>[];
  workoutSessions: Array<Record<string, unknown> & { sets: Record<string, unknown>[] }>;
  nutritionLogs: Record<string, unknown>[];
  bodyMeasurements: Record<string, unknown>[];
  caliperMeasurements: Record<string, unknown>[];
  projections: Record<string, unknown>[];
  oneRepMaxes: Record<string, unknown>[];
}

async function fetchUserRows(
  supabase: SupabaseClient,
  table: string,
  userId: string
): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("user_id", userId);

  if (error) return [];
  return (data ?? []) as Record<string, unknown>[];
}

export async function buildAccountExport(
  supabase: SupabaseClient,
  userId: string,
  email: string | null
): Promise<AccountExportBundle> {
  const [
    profileResult,
    equipment,
    recoveryEquipment,
    programs,
    workoutSessions,
    exerciseSets,
    nutritionLogs,
    bodyMeasurements,
    caliperMeasurements,
    projections,
    oneRepMaxes,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    fetchUserRows(supabase, "equipment_inventory", userId),
    fetchUserRows(supabase, "recovery_equipment", userId),
    fetchUserRows(supabase, "programs", userId),
    fetchUserRows(supabase, "workout_sessions", userId),
    fetchUserRows(supabase, "exercise_sets", userId),
    fetchUserRows(supabase, "nutrition_logs", userId),
    fetchUserRows(supabase, "body_measurements", userId),
    fetchUserRows(supabase, "caliper_measurements", userId),
    fetchUserRows(supabase, "projections", userId),
    fetchUserRows(supabase, "user_one_rep_maxes", userId),
  ]);

  const setsBySession = new Map<string, Record<string, unknown>[]>();
  for (const set of exerciseSets) {
    const sessionId = String(set.workout_session_id ?? "");
    const group = setsBySession.get(sessionId) ?? [];
    group.push(set);
    setsBySession.set(sessionId, group);
  }

  const sortedSessions = [...workoutSessions].sort((a, b) => {
    const aTime = String(a.started_at ?? "");
    const bTime = String(b.started_at ?? "");
    return bTime.localeCompare(aTime);
  });

  const sessionsWithSets: AccountExportBundle["workoutSessions"] =
    sortedSessions.map((session) => ({
      ...session,
      sets: setsBySession.get(String(session.id ?? "")) ?? [],
    }));

  return {
    formatVersion: ACCOUNT_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    account: { id: userId, email },
    profile: (profileResult.data as Record<string, unknown> | null) ?? null,
    equipment,
    recoveryEquipment,
    programs,
    workoutSessions: sessionsWithSets,
    nutritionLogs,
    bodyMeasurements,
    caliperMeasurements,
    projections,
    oneRepMaxes,
  };
}
