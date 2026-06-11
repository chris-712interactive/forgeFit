import {
  getRecommendationValue,
  matchRules,
  type EvidenceRule,
  type RuleContext,
} from "@forgefit/evidence-kb";
import type {
  NutritionTargets,
  ProgramUserProfile,
  TrainingExpenditure,
  TrainingLoadSummary,
} from "./types";

export interface ComputeNutritionOptions {
  trainingLoad?: TrainingLoadSummary;
  expenditure?: TrainingExpenditure;
}

function mifflinStJeor(profile: ProgramUserProfile): number {
  const s = profile.sex === "male" ? 5 : -161;
  return (
    10 * profile.weightKg +
    6.25 * profile.heightCm -
    5 * profile.age +
    s
  );
}

function lifestyleFactor(rules: EvidenceRule[]): number {
  return (
    getRecommendationValue<number>(rules, "lifestyle_factor", "optimal") ?? 1.35
  );
}

function eatBackPct(
  rules: EvidenceRule[],
  key: string,
  fallback: number
): number {
  return getRecommendationValue<number>(rules, key, "optimal") ?? fallback;
}

function legacyTdee(profile: ProgramUserProfile): number {
  return mifflinStJeor(profile) * 1.55;
}

function legacyNutrition(
  profile: ProgramUserProfile,
  rules: EvidenceRule[]
): NutritionTargets {
  const proteinPerKg =
    getRecommendationValue<number>(rules, "protein_g_per_kg", "optimal") ?? 1.8;
  const fatPerKg =
    getRecommendationValue<number>(rules, "fat_g_per_kg", "optimal") ?? 0.9;

  const tdee = legacyTdee(profile);
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

export function computeNutrition(
  profile: ProgramUserProfile,
  rules: EvidenceRule[],
  options: ComputeNutritionOptions = {}
): NutritionTargets {
  if (!options.expenditure || !options.trainingLoad) {
    return legacyNutrition(profile, rules);
  }

  const proteinPerKg =
    getRecommendationValue<number>(rules, "protein_g_per_kg", "optimal") ?? 1.8;
  const fatPerKg =
    getRecommendationValue<number>(rules, "fat_g_per_kg", "optimal") ?? 0.9;

  const bmrKcal = Math.round(mifflinStJeor(profile));
  const lifestyleKcal = Math.round(bmrKcal * lifestyleFactor(rules));
  const trainingKcalPerDay = options.expenditure.dailyTrainingKcal;
  const grossTdee = lifestyleKcal + trainingKcalPerDay;

  let calories = grossTdee;
  let calorieRuleId: string | undefined;
  let effectiveDeficitKcal: number | undefined;
  let effectiveSurplusKcal: number | undefined;

  const baseDeficit =
    getRecommendationValue<number>(rules, "daily_deficit_kcal", "optimal") ?? 400;

  if (profile.goal === "fat_loss") {
    const eatBack = eatBackPct(rules, "eat_back_pct", 0.5);
    calories =
      grossTdee -
      baseDeficit -
      trainingKcalPerDay * (1 - eatBack);
    calorieRuleId = "training_eat_back_fat_loss";
    effectiveDeficitKcal = Math.round(grossTdee - calories);
  } else if (profile.goal === "recomposition") {
    const eatBack = eatBackPct(rules, "recomp_eat_back_pct", 0.65);
    calories =
      grossTdee - 150 - trainingKcalPerDay * (1 - eatBack);
    calorieRuleId = "recomposition_training";
    effectiveDeficitKcal = Math.round(grossTdee - calories);
  } else if (
    profile.goal === "bodybuilding" ||
    profile.goal === "general_strength"
  ) {
    const eatBack = eatBackPct(rules, "gain_eat_back_pct", 0.5);
    calories = grossTdee + 250 + trainingKcalPerDay * eatBack;
    calorieRuleId = "lean_gain_rate";
    effectiveSurplusKcal = Math.round(calories - grossTdee);
  } else if (profile.goal === "powerlifting") {
    const eatBack = eatBackPct(rules, "gain_eat_back_pct", 0.5);
    calories = grossTdee + 200 + trainingKcalPerDay * eatBack;
    calorieRuleId = "lean_gain_rate";
    effectiveSurplusKcal = Math.round(calories - grossTdee);
  }

  const proteinG = Math.round(proteinPerKg * profile.weightKg);
  const fatG = Math.round(fatPerKg * profile.weightKg);
  const roundedCalories = Math.round(calories);
  const carbsG = Math.max(
    0,
    Math.round((roundedCalories - proteinG * 4 - fatG * 9) / 4)
  );

  const proteinRule = rules.find((r) =>
    r.recommendation.protein_g_per_kg !== undefined
  );

  return {
    calories: roundedCalories,
    proteinG,
    fatG,
    carbsG,
    proteinRuleId: proteinRule?.id ?? "protein_deficit_general",
    calorieRuleId,
    bmrKcal,
    lifestyleKcal,
    trainingKcalPerDay,
    tdeeKcal: grossTdee,
    effectiveDeficitKcal,
    effectiveSurplusKcal,
    trainingLoad: options.trainingLoad,
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
