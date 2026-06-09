import {
  getRecommendationValue,
  matchRules,
  type EvidenceRule,
  type RuleContext,
} from "@forgefit/evidence-kb";
import type { NutritionTargets, ProgramUserProfile } from "./types";

function mifflinStJeor(profile: ProgramUserProfile): number {
  const s = profile.sex === "male" ? 5 : -161;
  return (
    10 * profile.weightKg +
    6.25 * profile.heightCm -
    5 * profile.age +
    s
  );
}

export function computeNutrition(
  profile: ProgramUserProfile,
  rules: EvidenceRule[]
): NutritionTargets {
  const proteinPerKg =
    getRecommendationValue<number>(rules, "protein_g_per_kg", "optimal") ?? 1.8;
  const fatPerKg =
    getRecommendationValue<number>(rules, "fat_g_per_kg", "optimal") ?? 0.9;

  const tdee = mifflinStJeor(profile) * 1.55;
  let calories = tdee;
  let calorieRuleId: string | undefined;

  const deficit = getRecommendationValue<number>(
    rules,
    "daily_deficit_kcal",
    "optimal"
  );
  if (profile.goal === "fat_loss" && deficit) {
    calories = tdee - deficit;
    calorieRuleId = "deficit_calories_fat_loss";
  } else if (
    profile.goal === "bodybuilding" ||
    profile.goal === "general_strength"
  ) {
    calories = tdee + 250;
    calorieRuleId = "lean_gain_rate";
  } else if (profile.goal === "recomposition") {
    calories = tdee - 150;
    calorieRuleId = "recomposition_training";
  }

  const proteinG = Math.round(proteinPerKg * profile.weightKg);
  const fatG = Math.round(fatPerKg * profile.weightKg);
  const carbsG = Math.max(
    0,
    Math.round((calories - proteinG * 4 - fatG * 9) / 4)
  );

  const proteinRule = rules.find((r) =>
    r.recommendation.protein_g_per_kg !== undefined
  );

  return {
    calories: Math.round(calories),
    proteinG,
    fatG,
    carbsG,
    proteinRuleId: proteinRule?.id ?? "protein_deficit_general",
    calorieRuleId,
  };
}

export function buildRuleContext(profile: ProgramUserProfile): RuleContext {
  return {
    goal: profile.goal,
    experience: profile.experience,
    weightKg: profile.weightKg,
    heightCm: profile.heightCm,
    recoveryEquipment: profile.recoveryEquipment,
  };
}

export function getMatchedRules(
  allRules: EvidenceRule[],
  profile: ProgramUserProfile
): EvidenceRule[] {
  return matchRules(allRules, buildRuleContext(profile));
}
