import { createClient } from "@/lib/supabase/server";
import type { WorkoutSessionRecord, WorkoutSetRecord } from "./sessions";

export interface ServerSessionsResult {
  records: WorkoutSessionRecord[];
  /** False when workout_sessions table is missing (Phase 3 migration not applied). */
  tableReady: boolean;
}

function isWorkoutTableMissing(error: { message?: string; code?: string }): boolean {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "PGRST205" ||
    message.includes("workout_sessions") ||
    message.includes("schema cache")
  );
}

function isRecoveryColumnMissing(error: { message?: string }): boolean {
  const message = error.message?.toLowerCase() ?? "";
  return message.includes("recovery_");
}

export async function getServerSessionRecords(
  userId: string,
  limit = 50
): Promise<ServerSessionsResult> {
  const supabase = await createClient();

  const baseSelect =
    "id, client_id, day_index, session_name, status, started_at, completed_at";
  const recoverySelect =
    ", recovery_name, recovery_equipment, recovery_planned_minutes, recovery_status, recovery_duration_ms, recovery_completed_at";

  let sessions:
    | Array<Record<string, unknown>>
    | null = null;
  let error: { message?: string; code?: string } | null = null;

  const withRecovery = await supabase
    .from("workout_sessions")
    .select(`${baseSelect}${recoverySelect}`)
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(limit);

  sessions = withRecovery.data;
  error = withRecovery.error;

  if (error && isRecoveryColumnMissing(error)) {
    const fallback = await supabase
      .from("workout_sessions")
      .select(baseSelect)
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(limit);
    sessions = fallback.data;
    error = fallback.error;
  }

  if (error) {
    return { records: [], tableReady: !isWorkoutTableMissing(error) };
  }

  if (!sessions?.length) {
    return { records: [], tableReady: true };
  }

  const sessionIds = sessions.map((s) => s.id);
  const { data: sets } = await supabase
    .from("exercise_sets")
    .select(
      "workout_session_id, exercise_id, exercise_name, set_number, reps, duration_ms, weight_kg, rir, completed"
    )
    .in("workout_session_id", sessionIds);

  const setsBySession = new Map<string, WorkoutSetRecord[]>();
  for (const set of sets ?? []) {
    const group = setsBySession.get(set.workout_session_id) ?? [];
    group.push({
      exerciseId: set.exercise_id,
      exerciseName: set.exercise_name,
      setNumber: set.set_number,
      reps: set.reps ?? undefined,
      durationMs: set.duration_ms ?? undefined,
      weightKg: set.weight_kg != null ? Number(set.weight_kg) : undefined,
      rir: set.rir ?? undefined,
      completed: set.completed,
    });
    setsBySession.set(set.workout_session_id, group);
  }

  return {
    tableReady: true,
    records: sessions.map((session) => ({
      id: String(session.id),
      clientId: String(session.client_id),
      dayIndex: Number(session.day_index),
      sessionName: String(session.session_name),
      status: String(session.status),
      startedAt: String(session.started_at),
      completedAt: (session.completed_at as string | null) ?? null,
      recoveryBlock:
        session.recovery_name && session.recovery_equipment
          ? {
              name: String(session.recovery_name),
              equipment: String(session.recovery_equipment),
              durationMinutes: Number(session.recovery_planned_minutes ?? 5),
            }
          : undefined,
      recoveryStatus:
        (session.recovery_status as "completed" | "skipped" | null) ??
        undefined,
      recoveryDurationMs:
        session.recovery_duration_ms != null
          ? Number(session.recovery_duration_ms)
          : undefined,
      recoveryCompletedAt:
        (session.recovery_completed_at as string | null) ?? null,
      sets: (setsBySession.get(String(session.id)) ?? []).sort(
        (a, b) =>
          a.exerciseId.localeCompare(b.exerciseId) || a.setNumber - b.setNumber
      ),
    })),
  };
}
