import { createClient } from "@/lib/supabase/server";

export interface WorkoutHistoryItem {
  id: string;
  sessionName: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  setCount: number;
  completedSetCount: number;
  pendingSync?: boolean;
}

export async function getWorkoutHistory(
  userId: string,
  limit = 10
): Promise<WorkoutHistoryItem[]> {
  const supabase = await createClient();

  const { data: sessions, error } = await supabase
    .from("workout_sessions")
    .select("id, session_name, status, started_at, completed_at")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error || !sessions?.length) {
    return [];
  }

  const sessionIds = sessions.map((s) => s.id);
  const { data: sets } = await supabase
    .from("exercise_sets")
    .select("workout_session_id, completed")
    .in("workout_session_id", sessionIds);

  const counts = new Map<string, { total: number; completed: number }>();
  for (const set of sets ?? []) {
    const entry = counts.get(set.workout_session_id) ?? {
      total: 0,
      completed: 0,
    };
    entry.total += 1;
    if (set.completed) entry.completed += 1;
    counts.set(set.workout_session_id, entry);
  }

  return sessions.map((session) => {
    const stats = counts.get(session.id) ?? { total: 0, completed: 0 };
    return {
      id: session.id,
      sessionName: session.session_name,
      status: session.status,
      startedAt: session.started_at,
      completedAt: session.completed_at,
      setCount: stats.total,
      completedSetCount: stats.completed,
    };
  });
}
