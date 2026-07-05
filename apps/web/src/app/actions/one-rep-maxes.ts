"use server";

import {
  ONE_REP_MAX_LIFTS,
  type OneRepMaxLiftId,
} from "@/lib/progression/one-rep-max-lifts";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getImpersonationMutationBlock } from "@/lib/auth/member-context";

const liftIdSchema = z.enum(
  ONE_REP_MAX_LIFTS.map((lift) => lift.exerciseId) as [
    OneRepMaxLiftId,
    ...OneRepMaxLiftId[],
  ]
);

const saveSchema = z.object({
  exerciseId: liftIdSchema,
  weightKg: z.number().min(1).max(500),
});

export async function saveUserOneRepMax(
  exerciseId: OneRepMaxLiftId,
  weightKg: number
) {
  const parsed = saveSchema.safeParse({ exerciseId, weightKg });
  if (!parsed.success) {
    return { error: "Enter a valid weight for this lift." };
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
      source: "user_declared",
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

  return { success: true as const };
}

export async function clearUserOneRepMax(exerciseId: OneRepMaxLiftId) {
  const parsed = liftIdSchema.safeParse(exerciseId);
  if (!parsed.success) {
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
    .eq("exercise_id", parsed.data);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/workout");

  return { success: true as const };
}
