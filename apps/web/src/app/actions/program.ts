"use server";

import { validateGoalsForAge } from "@/lib/onboarding/age-gates";
import { resolvedSportPracticeGymPolicy } from "@/lib/onboarding/sport-practice";
import { summarizePlanChanges } from "@/lib/programs/plan-diff";
import {
  generateAndSaveProgram,
  loadUserProgramContext,
} from "@/lib/programs/service";
import {
  resolveProgramStartDate,
  SCHEDULE_START_DATE_SCHEMA,
} from "@/lib/programs/start-date";
import { resolveProfileAge } from "@/lib/profile/identity";
import { createClient } from "@/lib/supabase/server";
import { friendlySupabaseError } from "@/lib/supabase/schema-errors";
import type { FatLossPace, FitnessGoal, RecompPriority, SportPracticeGymPolicy, SportSeasonPhase } from "@/lib/types/profile";
import {
  isValidSeasonPhase,
  isValidSportId,
  isValidSportPositionId,
  sportRequiresPosition,
} from "@forgefit/evidence-kb";
import {
  capExperienceForAge,
  maxMinutesPerSessionForAge,
  maxSessionsPerWeekForAge,
} from "@forgefit/program-engine";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getImpersonationMutationBlock } from "@/lib/auth/member-context";

const planSettingsSchema = z
  .object({
    primary_goal: z.enum([
      "fat_loss",
      "bodybuilding",
      "powerlifting",
      "general_strength",
      "recomposition",
      "sport_performance",
      "functional_conditioning",
    ]),
    sport_id: z.string().optional(),
    sport_position_id: z.string().optional(),
    sport_season_phase: z
      .enum(["in_season", "off_season", "general_prep"])
      .optional(),
    sport_practice_days: z.array(z.number().int().min(0).max(6)).optional(),
    sport_practice_gym_policy: z
      .enum(["avoid", "allow_light", "allow"])
      .optional(),
    sport_practice_schedule_varies: z.boolean().optional(),
    secondary_goal: z
      .enum([
        "fat_loss",
        "bodybuilding",
        "powerlifting",
        "general_strength",
        "recomposition",
      ])
      .optional(),
    fat_loss_pace: z.enum(["steady", "moderate", "aggressive"]).optional(),
    recomp_priority: z.enum(["muscle", "balanced", "lean_out"]).optional(),
    goal_weight_kg: z.number().min(30).max(300).nullable().optional(),
    sessions_per_week: z.number().min(1).max(7),
    minutes_per_session: z.number().min(15).max(120),
    regenerate_program: z.boolean().optional(),
    schedule_start_date: z
      .string()
      .regex(SCHEDULE_START_DATE_SCHEMA)
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.primary_goal === "sport_performance") {
      if (!data.sport_id || !isValidSportId(data.sport_id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select a sport.",
          path: ["sport_id"],
        });
      }
      if (
        data.sport_id &&
        sportRequiresPosition(data.sport_id) &&
        (!data.sport_position_id ||
          !isValidSportPositionId(data.sport_id, data.sport_position_id))
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select your position.",
          path: ["sport_position_id"],
        });
      }
      if (
        !data.sport_season_phase ||
        !isValidSeasonPhase(data.sport_season_phase)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select a season phase.",
          path: ["sport_season_phase"],
        });
      }
      const practiceVaries = data.sport_practice_schedule_varies === true;
      if (
        !practiceVaries &&
        (data.sport_practice_days?.length ?? 0) === 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select practice days or mark your schedule as varying.",
          path: ["sport_practice_days"],
        });
      }
      if (
        !resolvedSportPracticeGymPolicy(
          data.sport_practice_gym_policy,
          data.sport_season_phase
        )
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select a gym-on-practice-day preference.",
          path: ["sport_practice_gym_policy"],
        });
      }
    } else if (data.primary_goal === "fat_loss" && !data.fat_loss_pace) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a fat-loss pace when goal is fat loss.",
        path: ["fat_loss_pace"],
      });
    } else if (
      data.primary_goal === "recomposition" &&
      !data.recomp_priority
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a recomp priority.",
        path: ["recomp_priority"],
      });
    }

    const needsFatLossPace =
      data.primary_goal === "fat_loss" ||
      (data.primary_goal === "sport_performance" &&
        data.secondary_goal === "fat_loss");
    if (needsFatLossPace && !data.fat_loss_pace) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a fat-loss pace.",
        path: ["fat_loss_pace"],
      });
    }

    const needsRecomp =
      data.primary_goal === "recomposition" ||
      (data.primary_goal === "sport_performance" &&
        data.secondary_goal === "recomposition");
    if (needsRecomp && !data.recomp_priority) {
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

export async function rebuildProgram(input?: {
  schedule_start_date?: string;
  last_completed_session_kind?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }
  const impersonationBlock = await getImpersonationMutationBlock();
  if (impersonationBlock) return impersonationBlock;


  const start = resolveProgramStartDate(input?.schedule_start_date);
  if ("error" in start) {
    return { error: start.error };
  }

  const result = await generateAndSaveProgram(user.id, null, {
    startDate: start.startDate,
    lastSessionKindOverride: input?.last_completed_session_kind,
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
  sport_id?: string;
  sport_position_id?: string;
  sport_season_phase?: SportSeasonPhase;
  sport_practice_days?: number[];
  sport_practice_gym_policy?: SportPracticeGymPolicy;
  sport_practice_schedule_varies?: boolean;
  secondary_goal?: FitnessGoal;
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
  const impersonationBlock = await getImpersonationMutationBlock();
  if (impersonationBlock) return impersonationBlock;


  const ctx = await loadUserProgramContext(user.id);
  if (!ctx) {
    return { error: "Complete onboarding before updating your plan." };
  }

  const age = resolveProfileAge(ctx.profile) ?? ctx.profile.age ?? 18;
  const ageError = validateGoalsForAge({
    age,
    primary_goal: parsed.data.primary_goal,
    secondary_goal: parsed.data.secondary_goal,
    fat_loss_pace: parsed.data.fat_loss_pace,
  });
  if (ageError) {
    return { error: ageError };
  }

  if (parsed.data.sessions_per_week > maxSessionsPerWeekForAge(age)) {
    return { error: "Sessions per week exceeds the limit for your age." };
  }
  if (parsed.data.minutes_per_session > maxMinutesPerSessionForAge(age)) {
    return { error: "Session length exceeds the limit for your age." };
  }

  const { regenerate_program, ...profileFields } = parsed.data;
  const isSport = parsed.data.primary_goal === "sport_performance";

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      primary_goal: profileFields.primary_goal,
      sessions_per_week: profileFields.sessions_per_week,
      minutes_per_session: profileFields.minutes_per_session,
      experience_level: capExperienceForAge(
        ctx.profile.experience_level!,
        age
      ),
      fat_loss_pace:
        parsed.data.primary_goal === "fat_loss" ||
        parsed.data.secondary_goal === "fat_loss"
          ? parsed.data.fat_loss_pace ?? null
          : null,
      recomp_priority:
        parsed.data.primary_goal === "recomposition" ||
        parsed.data.secondary_goal === "recomposition"
          ? parsed.data.recomp_priority ?? null
          : null,
      goal_weight_kg: profileFields.goal_weight_kg ?? null,
      sport_id: isSport ? parsed.data.sport_id ?? null : null,
      sport_position_id: isSport ? parsed.data.sport_position_id ?? null : null,
      sport_season_phase: isSport ? parsed.data.sport_season_phase ?? null : null,
      sport_practice_days: isSport ? parsed.data.sport_practice_days ?? [] : [],
      sport_practice_gym_policy: isSport
        ? resolvedSportPracticeGymPolicy(
            parsed.data.sport_practice_gym_policy,
            parsed.data.sport_season_phase
          )
        : null,
      sport_practice_schedule_varies: isSport
        ? parsed.data.sport_practice_schedule_varies ?? false
        : false,
      secondary_goal: isSport ? parsed.data.secondary_goal ?? null : null,
    })
    .eq("id", user.id);

  if (profileError) {
    return { error: friendlySupabaseError(profileError.message) };
  }

  if (!regenerate_program) {
    revalidateProgramPaths();
    return { success: true as const, regenerated: false as const };
  }

  const start = resolveProgramStartDate(parsed.data.schedule_start_date);
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
