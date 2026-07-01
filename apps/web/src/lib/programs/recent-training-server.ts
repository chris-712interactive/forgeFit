import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { WorkoutSessionRecord } from "@/lib/workouts/sessions";
import { resolveLastSessionKindForRegenerate } from "./recent-training";

function mapDbSessionRow(row: {
  session_name: string;
  status: string;
  started_at: string;
  completed_at: string | null;
}): WorkoutSessionRecord {
  return {
    id: "db",
    clientId: "db",
    dayIndex: 0,
    sessionName: String(row.session_name),
    status: String(row.status),
    startedAt: String(row.started_at),
    completedAt: row.completed_at,
    sets: [],
  };
}

/** Direct DB read when bundled session fetch returns no usable history. */
export async function fetchLastSessionKindFromDb(
  userId: string,
  startDate: Date
): Promise<string | undefined> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workout_sessions")
    .select("session_name, status, started_at, completed_at")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false, nullsFirst: false })
    .limit(30);

  if (!data?.length) return undefined;

  return resolveLastSessionKindForRegenerate(
    data.map(mapDbSessionRow),
    startDate
  );
}
