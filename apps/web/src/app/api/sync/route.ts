import type { SyncRequestBody } from "@forgefit/offline-sync";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

function friendlySyncError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("workout_sessions") && lower.includes("does not exist")) {
    return "workout_sessions table missing — run 20260608200000_phase3_workouts.sql in Supabase.";
  }
  if (lower.includes("exercise_sets") && lower.includes("does not exist")) {
    return "exercise_sets table missing — run 20260608200000_phase3_workouts.sql in Supabase.";
  }
  if (lower.includes("violates foreign key constraint") && lower.includes("program")) {
    return "Program link invalid — retrying sync without program_id.";
  }
  return message;
}

const syncSchema = z.object({
  sessions: z.array(
    z.object({
      clientId: z.string().uuid(),
      programId: z.string().uuid().optional(),
      sessionName: z.string().min(1),
      dayIndex: z.number().int().min(0),
      status: z.enum(["in_progress", "completed", "cancelled"]),
      startedAt: z.string().min(1),
      completedAt: z.string().optional(),
      updatedAt: z.string().min(1),
      warmupName: z.string().optional(),
      warmupPlannedMinutes: z.number().int().positive().optional(),
      warmupStatus: z.enum(["completed", "skipped"]).optional(),
      warmupDurationMs: z.number().int().min(0).optional(),
      warmupCompletedAt: z.string().optional(),
      recoveryName: z.string().optional(),
      recoveryEquipment: z.string().optional(),
      recoveryPlannedMinutes: z.number().int().positive().optional(),
      recoveryStatus: z.enum(["completed", "skipped"]).optional(),
      recoveryDurationMs: z.number().int().min(0).optional(),
      recoveryCompletedAt: z.string().optional(),
    })
  ),
  sets: z.array(
    z.object({
      clientId: z.string().uuid(),
      sessionClientId: z.string().uuid(),
      exerciseId: z.string().min(1),
      exerciseName: z.string().min(1),
      setNumber: z.number().int().min(1),
      reps: z.number().finite().optional(),
      weightKg: z.number().finite().optional(),
      rir: z.number().int().min(0).max(10).optional(),
      completed: z.boolean(),
      completedAt: z.string().optional(),
      updatedAt: z.string().min(1),
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
    const parsed = syncSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: `Invalid sync payload: ${parsed.error.issues[0]?.message}` },
        { status: 400 }
      );
    }
    body = parsed.data;
  } catch {
    return NextResponse.json({ error: "Invalid sync payload" }, { status: 400 });
  }

  const sessionIdByClientId = new Map<string, string>();
  let syncedSessions = 0;
  let syncedSets = 0;

  for (const session of body.sessions) {
    const { data: existing, error: lookupError } = await supabase
      .from("workout_sessions")
      .select("id, updated_at")
      .eq("user_id", user.id)
      .eq("client_id", session.clientId)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json(
        { error: friendlySyncError(lookupError.message) },
        { status: 500 }
      );
    }

    if (existing) {
      const existingUpdated = new Date(existing.updated_at).getTime();
      const incomingUpdated = new Date(session.updatedAt).getTime();
      const isTerminal =
        session.status === "completed" || session.status === "cancelled";
      if (isTerminal || incomingUpdated >= existingUpdated) {
        const { error } = await supabase
          .from("workout_sessions")
          .update({
            program_id: session.programId ?? null,
            session_name: session.sessionName,
            day_index: session.dayIndex,
            status: session.status,
            started_at: session.startedAt,
            completed_at: session.completedAt ?? null,
            updated_at: session.updatedAt,
            warmup_name: session.warmupName ?? null,
            warmup_planned_minutes: session.warmupPlannedMinutes ?? null,
            warmup_status: session.warmupStatus ?? null,
            warmup_duration_ms: session.warmupDurationMs ?? null,
            warmup_completed_at: session.warmupCompletedAt ?? null,
            recovery_name: session.recoveryName ?? null,
            recovery_equipment: session.recoveryEquipment ?? null,
            recovery_planned_minutes: session.recoveryPlannedMinutes ?? null,
            recovery_status: session.recoveryStatus ?? null,
            recovery_duration_ms: session.recoveryDurationMs ?? null,
            recovery_completed_at: session.recoveryCompletedAt ?? null,
          })
          .eq("id", existing.id);
        if (error) {
          return NextResponse.json(
            { error: friendlySyncError(error.message) },
            { status: 500 }
          );
        }
      }
      sessionIdByClientId.set(session.clientId, existing.id);
      syncedSessions++;
      continue;
    }

    const sessionRow = {
      user_id: user.id,
      client_id: session.clientId,
      program_id: session.programId ?? null,
      session_name: session.sessionName,
      day_index: session.dayIndex,
      status: session.status,
      started_at: session.startedAt,
      completed_at: session.completedAt ?? null,
      updated_at: session.updatedAt,
      warmup_name: session.warmupName ?? null,
      warmup_planned_minutes: session.warmupPlannedMinutes ?? null,
      warmup_status: session.warmupStatus ?? null,
      warmup_duration_ms: session.warmupDurationMs ?? null,
      warmup_completed_at: session.warmupCompletedAt ?? null,
      recovery_name: session.recoveryName ?? null,
      recovery_equipment: session.recoveryEquipment ?? null,
      recovery_planned_minutes: session.recoveryPlannedMinutes ?? null,
      recovery_status: session.recoveryStatus ?? null,
      recovery_duration_ms: session.recoveryDurationMs ?? null,
      recovery_completed_at: session.recoveryCompletedAt ?? null,
    };

    let { data: inserted, error } = await supabase
      .from("workout_sessions")
      .insert(sessionRow)
      .select("id")
      .single();

    if (
      error?.message?.toLowerCase().includes("foreign key") &&
      sessionRow.program_id
    ) {
      ({ data: inserted, error } = await supabase
        .from("workout_sessions")
        .insert({ ...sessionRow, program_id: null })
        .select("id")
        .single());
    }

    if (error || !inserted) {
      return NextResponse.json(
        {
          error: friendlySyncError(
            error?.message ??
              "Failed to sync session. Apply the Phase 3 migration (workout_sessions table)."
          ),
        },
        { status: 500 }
      );
    }

    sessionIdByClientId.set(session.clientId, inserted.id);
    syncedSessions++;
  }

  for (const set of body.sets) {
    let workoutSessionId = sessionIdByClientId.get(set.sessionClientId);
    if (!workoutSessionId) {
      const { data: sessionRow, error: lookupError } = await supabase
        .from("workout_sessions")
        .select("id")
        .eq("user_id", user.id)
        .eq("client_id", set.sessionClientId)
        .maybeSingle();

      if (lookupError) {
        return NextResponse.json({ error: lookupError.message }, { status: 500 });
      }
      workoutSessionId = sessionRow?.id;
    }

    if (!workoutSessionId) {
      return NextResponse.json(
        {
          error:
            "Workout session missing on server. Sync sessions before sets, or apply the Phase 3 migration.",
        },
        { status: 409 }
      );
    }

    const { data: existing, error: lookupError } = await supabase
      .from("exercise_sets")
      .select("id, updated_at")
      .eq("user_id", user.id)
      .eq("client_id", set.clientId)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json(
        { error: friendlySyncError(lookupError.message) },
        { status: 500 }
      );
    }

    const row = {
      workout_session_id: workoutSessionId,
      exercise_id: set.exerciseId,
      exercise_name: set.exerciseName,
      set_number: set.setNumber,
      reps: set.reps != null ? Math.round(set.reps) : null,
      duration_ms:
        set.durationMs != null ? Math.round(set.durationMs) : null,
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
        const { error } = await supabase
          .from("exercise_sets")
          .update(row)
          .eq("id", existing.id);
        if (error) {
          return NextResponse.json(
            { error: friendlySyncError(error.message) },
            { status: 500 }
          );
        }
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
      return NextResponse.json(
        { error: friendlySyncError(error.message) },
        { status: 500 }
      );
    }

    syncedSets++;
  }

  return NextResponse.json({ syncedSessions, syncedSets });
}
