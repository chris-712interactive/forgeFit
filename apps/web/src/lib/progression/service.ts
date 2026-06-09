import type { ProgramPlan } from "@forgefit/program-engine";
import { evaluatePromotion } from "./evaluate";
import type { PromotionEvaluation } from "./types";
import type { WorkoutSessionRecord } from "@/lib/workouts/sessions";
import { createClient } from "@/lib/supabase/server";

export async function getPromotionEvaluation(
  userId: string,
  sessions: WorkoutSessionRecord[],
  plan: ProgramPlan | null
): Promise<PromotionEvaluation | null> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("experience_level, promotion_snoozed_until")
    .eq("id", userId)
    .single();

  if (!profile?.experience_level) return null;

  return evaluatePromotion({
    sessions,
    plan,
    profile: {
      experienceLevel: profile.experience_level,
      promotionSnoozedUntil: profile.promotion_snoozed_until,
    },
  });
}
