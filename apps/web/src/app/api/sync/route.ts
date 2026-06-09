import type { SyncRequestBody } from "@forgefit/offline-sync";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const syncSchema = z.object({
  sessions: z.array(
    z.object({
      clientId: z.string().uuid(),
      programId: z.string().uuid().optional(),
      sessionName: z.string().min(1),
      dayIndex: z.number().int().min(0),
      status: z.enum(["in_progress", "completed", "cancelled"]),
      startedAt: z.string(),
      completedAt: z.string().optional(),
      updatedAt: z.string(),
    })
  ),
  sets: z.array(
    z.object({
      clientId: z.string().uuid(),
      sessionClientId: z.string().uuid(),
      exerciseId: z.string().min(1),
      exerciseName: z.string().min(1),
      setNumber: z.number().int().min(1),
      reps: z.number().int().min(0).optional(),
      weightKg: z.number().min(0).optional(),
      rir: z.number().int().min(0).max(10).optional(),
      completed: z.boolean(),
      completedAt: z.string().optional(),
      updatedAt: z.string(),
    })
  ),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SyncRequestBody;
  try {
    const json = await request.json();
    body = syncSchema.parse(json);
  } catch {
    return NextResponse.json({ error: "Invalid sync payload" }, { status: 400 });
  }

  const sessionIdByClientId = new Map<string, string>();
  let syncedSessions = 0;
  let syncedSets = 0;

  for (const session of body.sessions) {
    const { data: existing } = await supabase
      .from("workout_sessions")
      .select("id, updated_at")
      .eq("user_id", user.id)
      .eq("client_id", session.clientId)
      .maybeSingle();

    if (existing) {
      const existingUpdated = new Date(existing.updated_at).getTime();
      const incomingUpdated = new Date(session.updatedAt).getTime();
      if (incomingUpdated >= existingUpdated) {
        await supabase
          .from("workout_sessions")
          .update({
            program_id: session.programId ?? null,
            session_name: session.sessionName,
            day_index: session.dayIndex,
            status: session.status,
            started_at: session.startedAt,
            completed_at: session.completedAt ?? null,
            updated_at: session.updatedAt,
          })
          .eq("id", existing.id);
      }
      sessionIdByClientId.set(session.clientId, existing.id);
      syncedSessions++;
      continue;
    }

    const { data: inserted, error } = await supabase
      .from("workout_sessions")
      .insert({
        user_id: user.id,
        client_id: session.clientId,
        program_id: session.programId ?? null,
        session_name: session.sessionName,
        day_index: session.dayIndex,
        status: session.status,
        started_at: session.startedAt,
        completed_at: session.completedAt ?? null,
        updated_at: session.updatedAt,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to sync session" },
        { status: 500 }
      );
    }

    sessionIdByClientId.set(session.clientId, inserted.id);
    syncedSessions++;
  }

  for (const set of body.sets) {
    let workoutSessionId = sessionIdByClientId.get(set.sessionClientId);
    if (!workoutSessionId) {
      const { data: sessionRow } = await supabase
        .from("workout_sessions")
        .select("id")
        .eq("user_id", user.id)
        .eq("client_id", set.sessionClientId)
        .maybeSingle();
      workoutSessionId = sessionRow?.id;
    }

    if (!workoutSessionId) {
      continue;
    }

    const { data: existing } = await supabase
      .from("exercise_sets")
      .select("id, updated_at")
      .eq("user_id", user.id)
      .eq("client_id", set.clientId)
      .maybeSingle();

    const row = {
      workout_session_id: workoutSessionId,
      exercise_id: set.exerciseId,
      exercise_name: set.exerciseName,
      set_number: set.setNumber,
      reps: set.reps ?? null,
      weight_kg: set.weightKg ?? null,
      rir: set.rir ?? null,
      completed: set.completed,
      completed_at: set.completedAt ?? null,
      updated_at: set.updatedAt,
    };

    if (existing) {
      const existingUpdated = new Date(existing.updated_at).getTime();
      const incomingUpdated = new Date(set.updatedAt).getTime();
      if (incomingUpdated >= existingUpdated) {
        await supabase.from("exercise_sets").update(row).eq("id", existing.id);
      }
      syncedSets++;
      continue;
    }

    const { error } = await supabase.from("exercise_sets").insert({
      user_id: user.id,
      client_id: set.clientId,
      ...row,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    syncedSets++;
  }

  return NextResponse.json({ syncedSessions, syncedSets });
}
