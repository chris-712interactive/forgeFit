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

export async function getServerSessionRecords(
  userId: string,
  limit = 50
): Promise<ServerSessionsResult> {
  const supabase = await createClient();

  const { data: sessions, error } = await supabase
    .from("workout_sessions")
    .select(
      "id, client_id, day_index, session_name, status, started_at, completed_at"
    )
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(limit);

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
      "workout_session_id, exercise_id, exercise_name, set_number, reps, weight_kg, rir, completed"
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
      weightKg: set.weight_kg != null ? Number(set.weight_kg) : undefined,
      rir: set.rir ?? undefined,
      completed: set.completed,
    });
    setsBySession.set(set.workout_session_id, group);
  }

  return {
    tableReady: true,
    records: sessions.map((session) => ({
      id: session.id,
      clientId: session.client_id,
      dayIndex: session.day_index,
      sessionName: session.session_name,
      status: session.status,
      startedAt: session.started_at,
      completedAt: session.completed_at,
      sets: (setsBySession.get(session.id) ?? []).sort(
        (a, b) =>
          a.exerciseId.localeCompare(b.exerciseId) || a.setNumber - b.setNumber
      ),
    })),
  };
}
