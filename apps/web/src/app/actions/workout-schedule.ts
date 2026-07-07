"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getImpersonationMutationBlock } from "@/lib/auth/member-context";
import type { WorkoutScheduleOverride } from "@/lib/workouts/schedule-overrides";
import {
  deleteWorkoutScheduleOverride,
  listWorkoutScheduleOverrides,
  upsertWorkoutScheduleOverride,
} from "@/lib/workouts/schedule-overrides-server";

const overrideSchema = z.object({
  weekStartIso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dayIndex: z.number().int().min(0).max(6),
  adjustedDateIso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const saveSchema = z.object({
  programId: z.string().uuid().optional(),
  overrides: z.array(overrideSchema),
});

export async function saveWorkoutScheduleOverrides(input: {
  programId?: string;
  overrides: WorkoutScheduleOverride[];
}) {
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid schedule adjustment." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const impersonationBlock = await getImpersonationMutationBlock();
  if (impersonationBlock) return impersonationBlock;

  try {
    const { overrides: existing } = await listWorkoutScheduleOverrides(user.id);
    const nextKeys = new Set(
      parsed.data.overrides.map(
        (entry) => `${entry.weekStartIso}:${entry.dayIndex}`
      )
    );

    for (const entry of existing) {
      const key = `${entry.weekStartIso}:${entry.dayIndex}`;
      if (!nextKeys.has(key)) {
        await deleteWorkoutScheduleOverride({
          userId: user.id,
          weekStartIso: entry.weekStartIso,
          dayIndex: entry.dayIndex,
        });
      }
    }

    for (const entry of parsed.data.overrides) {
      await upsertWorkoutScheduleOverride({
        userId: user.id,
        programId: parsed.data.programId,
        weekStartIso: entry.weekStartIso,
        dayIndex: entry.dayIndex,
        adjustedDateIso: entry.adjustedDateIso,
      });
    }

    revalidatePath("/workout");
    revalidatePath("/home");
    revalidatePath("/program");

    return { success: true as const, overrides: parsed.data.overrides };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not save schedule.";
    if (message.toLowerCase().includes("workout_schedule_overrides")) {
      return {
        error:
          "Schedule adjustments are not available yet — apply migration 20260707120000_workout_schedule_overrides.sql in Supabase.",
      };
    }
    return { error: message };
  }
}
