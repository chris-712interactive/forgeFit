import { createClient } from "@/lib/supabase/server";
import type { WorkoutScheduleOverride } from "@/lib/workouts/schedule-overrides";

export interface ScheduleOverrideRow {
  week_start_date: string;
  day_index: number;
  adjusted_date: string;
  program_id: string | null;
  updated_at: string;
}

function mapRow(row: ScheduleOverrideRow): WorkoutScheduleOverride {
  return {
    weekStartIso: row.week_start_date,
    dayIndex: row.day_index,
    adjustedDateIso: row.adjusted_date,
  };
}

export async function listWorkoutScheduleOverrides(
  userId: string,
  weekStartIso?: string
): Promise<{ overrides: WorkoutScheduleOverride[]; tableReady: boolean }> {
  const supabase = await createClient();
  let query = supabase
    .from("workout_schedule_overrides")
    .select("week_start_date, day_index, adjusted_date, program_id, updated_at")
    .eq("user_id", userId)
    .order("week_start_date", { ascending: false })
    .order("day_index", { ascending: true });

  if (weekStartIso) {
    query = query.eq("week_start_date", weekStartIso);
  }

  const { data, error } = await query;

  if (error) {
    if (
      error.code === "PGRST205" ||
      error.message?.toLowerCase().includes("workout_schedule_overrides")
    ) {
      return { overrides: [], tableReady: false };
    }
    throw new Error(error.message);
  }

  return {
    overrides: (data ?? []).map((row) => mapRow(row as ScheduleOverrideRow)),
    tableReady: true,
  };
}

export async function upsertWorkoutScheduleOverride(input: {
  userId: string;
  programId?: string;
  weekStartIso: string;
  dayIndex: number;
  adjustedDateIso: string;
}): Promise<void> {
  const supabase = await createClient();
  const timestamp = new Date().toISOString();
  const { error } = await supabase.from("workout_schedule_overrides").upsert(
    {
      user_id: input.userId,
      program_id: input.programId ?? null,
      week_start_date: input.weekStartIso,
      day_index: input.dayIndex,
      adjusted_date: input.adjustedDateIso,
      updated_at: timestamp,
    },
    { onConflict: "user_id,week_start_date,day_index" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteWorkoutScheduleOverride(input: {
  userId: string;
  weekStartIso: string;
  dayIndex: number;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("workout_schedule_overrides")
    .delete()
    .eq("user_id", input.userId)
    .eq("week_start_date", input.weekStartIso)
    .eq("day_index", input.dayIndex);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteWorkoutScheduleOverridesForWeek(input: {
  userId: string;
  weekStartIso: string;
  exceptDayIndexes?: number[];
}): Promise<void> {
  const supabase = await createClient();
  let query = supabase
    .from("workout_schedule_overrides")
    .delete()
    .eq("user_id", input.userId)
    .eq("week_start_date", input.weekStartIso);

  if (input.exceptDayIndexes && input.exceptDayIndexes.length > 0) {
    query = query.not(
      "day_index",
      "in",
      `(${input.exceptDayIndexes.join(",")})`
    );
  }

  const { error } = await query;
  if (error) {
    throw new Error(error.message);
  }
}

export async function syncWorkoutScheduleOverrides(input: {
  userId: string;
  programId?: string;
  overrides: Array<{
    weekStartIso: string;
    dayIndex: number;
    adjustedDateIso: string;
    updatedAt: string;
  }>;
  deleted: Array<{ weekStartIso: string; dayIndex: number }>;
}): Promise<{ syncedOverrides: number; deletedOverrides: number }> {
  let syncedOverrides = 0;
  let deletedOverrides = 0;

  for (const entry of input.overrides) {
    await upsertWorkoutScheduleOverride({
      userId: input.userId,
      programId: input.programId,
      weekStartIso: entry.weekStartIso,
      dayIndex: entry.dayIndex,
      adjustedDateIso: entry.adjustedDateIso,
    });
    syncedOverrides += 1;
  }

  for (const entry of input.deleted) {
    await deleteWorkoutScheduleOverride({
      userId: input.userId,
      weekStartIso: entry.weekStartIso,
      dayIndex: entry.dayIndex,
    });
    deletedOverrides += 1;
  }

  return { syncedOverrides, deletedOverrides };
}
