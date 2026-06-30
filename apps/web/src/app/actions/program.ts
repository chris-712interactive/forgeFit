"use server";

import { summarizePlanChanges } from "@/lib/programs/plan-diff";
import {
  generateAndSaveProgram,
  loadUserProgramContext,
} from "@/lib/programs/service";
import {
  isValidPlanStartDate,
  parsePlanStartDateInput,
} from "@/lib/programs/start-date";
import { createClient } from "@/lib/supabase/server";
import type { FatLossPace, FitnessGoal, RecompPriority } from "@/lib/types/profile";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const planSettingsSchema = z
  .object({
    primary_goal: z.enum([
      "fat_loss",
      "bodybuilding",
      "powerlifting",
      "general_strength",
      "recomposition",
    ]),
    fat_loss_pace: z.enum(["steady", "moderate", "aggressive"]).optional(),
    recomp_priority: z.enum(["muscle", "balanced", "lean_out"]).optional(),
    goal_weight_kg: z.number().min(30).max(300).nullable().optional(),
    sessions_per_week: z.number().min(1).max(7),
    minutes_per_session: z.number().min(15).max(120),
    regenerate_program: z.boolean().optional(),
    schedule_start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.primary_goal === "fat_loss" && !data.fat_loss_pace) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a fat-loss pace when goal is fat loss.",
        path: ["fat_loss_pace"],
      });
    }
    if (data.primary_goal === "recomposition" && !data.recomp_priority) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a recomp priority.",
        path: ["recomp_priority"],
      });
    }
  });

function revalidateProgramPaths() {
  revalidatePath("/home");
  revalidatePath("/workout");
  revalidatePath("/nutrition");
  revalidatePath("/progress");
  revalidatePath("/profile");
  revalidatePath("/evidence");
}

function resolveStartDate(
  isoDate?: string
): { startDate: Date } | { error: string } {
  if (!isoDate) {
    return { startDate: new Date() };
  }

  if (!isValidPlanStartDate(isoDate)) {
    return {
      error: "Choose today or a future date for your new plan to start.",
    };
  }

  return { startDate: parsePlanStartDateInput(isoDate)! };
}

export async function rebuildProgram(input?: { schedule_start_date?: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const start = resolveStartDate(input?.schedule_start_date);
  if ("error" in start) {
    return { error: start.error };
  }

  const result = await generateAndSaveProgram(user.id, null, {
    startDate: start.startDate,
  });
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
  fat_loss_pace?: FatLossPace;
  recomp_priority?: RecompPriority;
  goal_weight_kg?: number | null;
  sessions_per_week: number;
  minutes_per_session: number;
  regenerate_program?: boolean;
  schedule_start_date?: string;
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
    .update({
      primary_goal: profileFields.primary_goal,
      sessions_per_week: profileFields.sessions_per_week,
      minutes_per_session: profileFields.minutes_per_session,
      fat_loss_pace:
        profileFields.primary_goal === "fat_loss"
          ? profileFields.fat_loss_pace ?? null
          : null,
      recomp_priority:
        profileFields.primary_goal === "recomposition"
          ? profileFields.recomp_priority ?? null
          : null,
      goal_weight_kg: profileFields.goal_weight_kg ?? null,
    })
    .eq("id", user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  if (!regenerate_program) {
    revalidateProgramPaths();
    return { success: true as const, regenerated: false as const };
  }

  const start = resolveStartDate(parsed.data.schedule_start_date);
  if ("error" in start) {
    return { error: start.error };
  }

  const result = await generateAndSaveProgram(user.id, null, {
    startDate: start.startDate,
  });
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
