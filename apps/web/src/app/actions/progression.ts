"use server";

import {
  generateAndSaveProgram,
  getActiveProgram,
} from "@/lib/programs/service";
import { resolveProgramStartDate } from "@/lib/programs/start-date";
import { evaluatePromotion } from "@/lib/progression/evaluate";
import { createClient } from "@/lib/supabase/server";
import { getServerSessionRecords } from "@/lib/workouts/sessions-server";
import type { ExperienceLevel } from "@/lib/types/profile";
import { revalidatePath } from "next/cache";
import { getImpersonationMutationBlock } from "@/lib/auth/member-context";
import {
  FEATURE_SAVE_TEMPORARILY_UNAVAILABLE,
  memberFacingSchemaError,
} from "@/lib/ui/member-errors";

const SNOOZE_DAYS = 14;

async function loadPromotionContext(userId: string) {
  const supabase = await createClient();
  const [profileResult, plan, sessionResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("experience_level, promotion_snoozed_until")
      .eq("id", userId)
      .single(),
    getActiveProgram(userId),
    getServerSessionRecords(userId, 120),
  ]);

  if (!profileResult.data?.experience_level) {
    return { error: "Profile not ready for promotion." as const };
  }

  const evaluation = evaluatePromotion({
    sessions: sessionResult.records,
    plan,
    profile: {
      experienceLevel: profileResult.data.experience_level,
      promotionSnoozedUntil: profileResult.data.promotion_snoozed_until,
    },
  });

  return { evaluation, supabase };
}

export async function acceptExperiencePromotion(input?: {
  schedule_start_date?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }
  const impersonationBlock = await getImpersonationMutationBlock();
  if (impersonationBlock) return impersonationBlock;


  const ctx = await loadPromotionContext(user.id);
  if ("error" in ctx) return { error: ctx.error };

  const { evaluation } = ctx;
  if (!evaluation.eligible || !evaluation.nextLevel) {
    return { error: "Promotion requirements not met yet." };
  }

  const nextLevel = evaluation.nextLevel;
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      experience_level: nextLevel,
      experience_promoted_at: new Date().toISOString(),
      promotion_snoozed_until: null,
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("acceptExperiencePromotion:", updateError.message);
    return {
      error: updateError.message.includes("experience_promoted_at")
        ? FEATURE_SAVE_TEMPORARILY_UNAVAILABLE
        : memberFacingSchemaError(updateError.message),
    };
  }

  const start = resolveProgramStartDate(input?.schedule_start_date);
  if ("error" in start) {
    return { error: start.error };
  }

  const programResult = await generateAndSaveProgram(user.id, null, {
    startDate: start.startDate,
  });
  if ("error" in programResult) {
    return { error: programResult.error };
  }

  revalidatePath("/home");
  revalidatePath("/workout");
  revalidatePath("/nutrition");
  revalidatePath("/profile");
  revalidatePath("/evidence");

  return {
    newLevel: nextLevel as ExperienceLevel,
    plan: programResult.plan,
  };
}

export async function snoozeExperiencePromotion() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }
  const impersonationBlock = await getImpersonationMutationBlock();
  if (impersonationBlock) return impersonationBlock;


  const snoozeUntil = new Date();
  snoozeUntil.setDate(snoozeUntil.getDate() + SNOOZE_DAYS);

  const { error } = await supabase
    .from("profiles")
    .update({ promotion_snoozed_until: snoozeUntil.toISOString() })
    .eq("id", user.id);

  if (error) {
    console.error("snoozeExperiencePromotion:", error.message);
    return {
      error: error.message.includes("promotion_snoozed_until")
        ? FEATURE_SAVE_TEMPORARILY_UNAVAILABLE
        : memberFacingSchemaError(error.message),
    };
  }

  revalidatePath("/home");
  revalidatePath("/workout");
  revalidatePath("/profile");

  return { snoozedUntil: snoozeUntil.toISOString() };
}

export async function getPromotionPreview() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const ctx = await loadPromotionContext(user.id);
  if ("error" in ctx) return null;

  return ctx.evaluation;
}
