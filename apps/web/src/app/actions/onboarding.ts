"use server";

import { replaceUserEquipment } from "@/lib/equipment/service";
import { validateGoalsForAge } from "@/lib/onboarding/age-gates";
import { resolvedSportPracticeGymPolicy } from "@/lib/onboarding/sport-practice";
import {
  computeAgeFromDateOfBirth,
  isValidDateOfBirth,
  profileFullName,
} from "@/lib/profile/identity";
import { generateAndSaveProgram } from "@/lib/programs/service";
import { createClient } from "@/lib/supabase/server";
import { friendlySupabaseError } from "@/lib/supabase/schema-errors";
import type { OnboardingData } from "@/lib/types/profile";
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
  requiresParentConsent,
} from "@forgefit/program-engine";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getImpersonationMutationBlock } from "@/lib/auth/member-context";

const fitnessGoalSchema = z.enum([
  "fat_loss",
  "bodybuilding",
  "powerlifting",
  "general_strength",
  "recomposition",
  "sport_performance",
  "functional_conditioning",
]);

const onboardingSchema = z
  .object({
    primary_goal: fitnessGoalSchema,
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
    secondary_goal: fitnessGoalSchema.optional(),
    parent_consent_name: z.string().trim().max(120).optional(),
    parent_consent_email: z.string().trim().email().max(200).optional(),
    parent_consent_acknowledged: z.boolean().optional(),
    fat_loss_pace: z.enum(["steady", "moderate", "aggressive"]).optional(),
    recomp_priority: z.enum(["muscle", "balanced", "lean_out"]).optional(),
    goal_weight_kg: z.number().min(30).max(300).optional(),
    experience_level: z.enum(["beginner", "intermediate", "advanced"]),
    first_name: z.string().trim().min(1).max(80),
    last_name: z.string().trim().min(1).max(80),
    date_of_birth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date of birth."),
    sex: z.enum(["male", "female", "other", "prefer_not_to_say"]),
    height_cm: z.number().min(100).max(250),
    weight_kg: z.number().min(30).max(300),
    waist_cm: z.number().optional(),
    chest_cm: z.number().optional(),
    arms_cm: z.number().optional(),
    legs_cm: z.number().optional(),
    neck_cm: z.number().optional(),
    hips_cm: z.number().optional(),
    equipment: z.array(z.string()).min(1),
    equipment_location: z.enum(["home", "gym", "both"]),
    recovery_equipment: z.array(z.string()),
    sessions_per_week: z.number().min(1).max(7),
    minutes_per_session: z.number().min(15).max(120),
    why_started: z.string().min(10).max(500),
    signup_source: z.string().max(64).optional(),
    health_disclaimer_accepted: z.literal(true),
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
      if (data.secondary_goal === "sport_performance") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Secondary goal cannot be sport performance.",
          path: ["secondary_goal"],
        });
      }
      if (data.secondary_goal === "functional_conditioning") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Secondary goal cannot be functional conditioning.",
          path: ["secondary_goal"],
        });
      }
    } else {
      if (data.primary_goal === "fat_loss" && !data.fat_loss_pace) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select a fat-loss pace.",
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

    if (
      data.goal_weight_kg != null &&
      data.goal_weight_kg >= data.weight_kg
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Goal weight must be below your current weight.",
        path: ["goal_weight_kg"],
      });
    }
  });

export async function completeOnboarding(data: OnboardingData) {
  const parsed = onboardingSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Please check your answers and try again." };
  }

  if (!isValidDateOfBirth(parsed.data.date_of_birth)) {
    return { error: "You must be at least 13 years old to use ForgeRep." };
  }

  const age = computeAgeFromDateOfBirth(parsed.data.date_of_birth);
  const experience = capExperienceForAge(parsed.data.experience_level, age);

  const ageError = validateGoalsForAge({
    age,
    primary_goal: parsed.data.primary_goal,
    secondary_goal: parsed.data.secondary_goal,
    fat_loss_pace: parsed.data.fat_loss_pace,
  });
  if (ageError) {
    return { error: ageError };
  }

  if (requiresParentConsent(age)) {
    if (
      !parsed.data.parent_consent_acknowledged ||
      !parsed.data.parent_consent_name?.trim() ||
      !parsed.data.parent_consent_email?.trim()
    ) {
      return {
        error: "Parent or guardian sign-off is required for users under 16.",
      };
    }
  }

  if (parsed.data.sessions_per_week > maxSessionsPerWeekForAge(age)) {
    return { error: "Sessions per week exceeds the limit for your age." };
  }
  if (parsed.data.minutes_per_session > maxMinutesPerSessionForAge(age)) {
    return { error: "Session length exceeds the limit for your age." };
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


  const {
    equipment,
    equipment_location,
    recovery_equipment,
    health_disclaimer_accepted: _disclaimerAccepted,
    first_name,
    last_name,
    date_of_birth,
    sport_id,
    sport_position_id,
    sport_season_phase,
    sport_practice_days,
    sport_practice_gym_policy,
    sport_practice_schedule_varies,
    secondary_goal,
    parent_consent_name,
    parent_consent_email,
    parent_consent_acknowledged: _parentAck,
    ...profileFields
  } = parsed.data;

  const display_name =
    profileFullName({ first_name, last_name }) ?? `${first_name} ${last_name}`;

  const isSport = parsed.data.primary_goal === "sport_performance";
  const parentConsentAt = requiresParentConsent(age)
    ? new Date().toISOString()
    : null;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      ...profileFields,
      experience_level: experience,
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
      goal_weight_kg: parsed.data.goal_weight_kg ?? null,
      sport_id: isSport ? sport_id ?? null : null,
      sport_position_id: isSport ? sport_position_id ?? null : null,
      sport_season_phase: isSport ? sport_season_phase ?? null : null,
      sport_practice_days: isSport ? sport_practice_days ?? [] : [],
      sport_practice_gym_policy: isSport
        ? resolvedSportPracticeGymPolicy(
            sport_practice_gym_policy,
            sport_season_phase
          )
        : null,
      sport_practice_schedule_varies: isSport
        ? sport_practice_schedule_varies ?? false
        : false,
      secondary_goal: isSport ? secondary_goal ?? null : null,
      parent_consent_at: parentConsentAt,
      parent_consent_name: parentConsentAt ? parent_consent_name ?? null : null,
      parent_consent_email: parentConsentAt ? parent_consent_email ?? null : null,
      first_name,
      last_name,
      date_of_birth,
      display_name,
      age,
      onboarding_complete: true,
      health_disclaimer_accepted_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) {
    return { error: friendlySupabaseError(profileError.message) };
  }

  const measuredDate = new Date().toISOString().slice(0, 10);
  const { error: measurementError } = await supabase
    .from("body_measurements")
    .upsert(
      {
        user_id: user.id,
        measured_date: measuredDate,
        weight_kg: profileFields.weight_kg,
        waist_cm: profileFields.waist_cm ?? null,
        chest_cm: profileFields.chest_cm ?? null,
        arms_cm: profileFields.arms_cm ?? null,
        legs_cm: profileFields.legs_cm ?? null,
        neck_cm: profileFields.neck_cm ?? null,
        hips_cm: profileFields.hips_cm ?? null,
        notes: "From onboarding",
      },
      { onConflict: "user_id,measured_date" }
    );

  if (measurementError && !measurementError.message.includes("body_measurements")) {
    return { error: measurementError.message };
  }

  const equipmentResult = await replaceUserEquipment(
    supabase,
    user.id,
    {
      equipment,
      equipmentLocation: equipment_location,
      recoveryEquipment: recovery_equipment,
    },
    { updateHomeSnapshot: true }
  );
  if (equipmentResult.error) {
    return { error: equipmentResult.error };
  }

  const programResult = await generateAndSaveProgram(user.id);
  if (programResult && "error" in programResult && programResult.error) {
    return {
      error:
        "Your profile was saved, but we couldn’t build your training plan. Tap finish again to retry — if it keeps failing, contact support.",
    };
  }

  revalidatePath("/home");
  revalidatePath("/workout");

  const plan =
    programResult && "plan" in programResult ? programResult.plan : null;
  const firstDayIndex = plan?.week
    .slice()
    .sort((a, b) => a.dayIndex - b.dayIndex)[0]?.dayIndex;
  if (firstDayIndex != null) {
    redirect(`/workout?day=${firstDayIndex}`);
  }
  redirect("/home");
}
