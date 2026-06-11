"use server";

import { summarizePlanChanges } from "@/lib/programs/plan-diff";
import {
  generateAndSaveProgram,
  loadUserProgramContext,
} from "@/lib/programs/service";
import { createClient } from "@/lib/supabase/server";
import type { FitnessGoal } from "@/lib/types/profile";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const planSettingsSchema = z.object({
  primary_goal: z.enum([
    "fat_loss",
    "bodybuilding",
    "powerlifting",
    "general_strength",
    "recomposition",
  ]),
  sessions_per_week: z.number().min(1).max(7),
  minutes_per_session: z.number().min(15).max(120),
  regenerate_program: z.boolean().optional(),
});

function revalidateProgramPaths() {
  revalidatePath("/home");
  revalidatePath("/workout");
  revalidatePath("/nutrition");
  revalidatePath("/progress");
  revalidatePath("/profile");
  revalidatePath("/evidence");
}

export async function rebuildProgram() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const result = await generateAndSaveProgram(user.id);
  if ("error" in result) {
    return { error: result.error };
  }

  revalidateProgramPaths();

  return {
    success: true as const,
    changes: summarizePlanChanges(result.previousPlan, result.plan),
    isDeloadWeek: Boolean(result.plan.isDeloadWeek),
  };
}

export async function updatePlanSettings(input: {
  primary_goal: FitnessGoal;
  sessions_per_week: number;
  minutes_per_session: number;
  regenerate_program?: boolean;
}) {
  const parsed = planSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check your plan settings and try again." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const ctx = await loadUserProgramContext(user.id);
  if (!ctx) {
    return { error: "Complete onboarding before updating your plan." };
  }

  const { regenerate_program, ...profileFields } = parsed.data;

  const { error: profileError } = await supabase
    .from("profiles")
    .update(profileFields)
    .eq("id", user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  if (!regenerate_program) {
    revalidateProgramPaths();
    return { success: true as const, regenerated: false as const };
  }

  const result = await generateAndSaveProgram(user.id);
  if ("error" in result) {
    return { error: result.error };
  }

  revalidateProgramPaths();

  return {
    success: true as const,
    regenerated: true as const,
    changes: summarizePlanChanges(result.previousPlan, result.plan),
    isDeloadWeek: Boolean(result.plan.isDeloadWeek),
  };
}
