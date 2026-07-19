"use server";

import { exerciseTracksWeight, resolveExerciseDetail } from "@forgefit/exercise-db";
import {
  type OneRepMaxSource,
  ONE_REP_MAX_SOURCES,
} from "@/lib/progression/one-rep-max-source";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getImpersonationMutationBlock } from "@/lib/auth/member-context";

const saveSchema = z.object({
  exerciseId: z.string().min(1).max(120),
  weightKg: z.number().min(1).max(500),
  source: z.enum(
    ONE_REP_MAX_SOURCES as [OneRepMaxSource, ...OneRepMaxSource[]]
  ),
});

function validateExerciseId(exerciseId: string): string | null {
  if (!resolveExerciseDetail(exerciseId)) {
    return "Unknown exercise.";
  }
  if (!exerciseTracksWeight(exerciseId)) {
    return "This exercise does not use a trackable external load.";
  }
  return null;
}

export async function saveUserOneRepMax(
  exerciseId: string,
  weightKg: number,
  source: OneRepMaxSource = "user_declared"
) {
  const parsed = saveSchema.safeParse({ exerciseId, weightKg, source });
  if (!parsed.success) {
    return { error: "Enter a valid weight for this lift." };
  }

  const exerciseError = validateExerciseId(parsed.data.exerciseId);
  if (exerciseError) {
    return { error: exerciseError };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }
  const impersonationBlock = await getImpersonationMutationBlock();
  if (impersonationBlock) return impersonationBlock;

  const { error } = await supabase.from("user_one_rep_maxes").upsert(
    {
      user_id: user.id,
      exercise_id: parsed.data.exerciseId,
      weight_kg: parsed.data.weightKg,
      source: parsed.data.source,
    },
    { onConflict: "user_id,exercise_id" }
  );

  if (error) {
    return {
      error: error.message.includes("user_one_rep_maxes")
        ? "Apply the user_one_rep_maxes migration in Supabase."
        : error.message,
    };
  }

  revalidatePath("/profile");
  revalidatePath("/workout");
  revalidatePath("/progress");

  return { success: true as const };
}

export async function clearUserOneRepMax(exerciseId: string) {
  if (!exerciseId.trim()) {
    return { error: "Invalid lift." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }
  const impersonationBlock = await getImpersonationMutationBlock();
  if (impersonationBlock) return impersonationBlock;

  const { error } = await supabase
    .from("user_one_rep_maxes")
    .delete()
    .eq("user_id", user.id)
    .eq("exercise_id", exerciseId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/workout");
  revalidatePath("/progress");

  return { success: true as const };
}
