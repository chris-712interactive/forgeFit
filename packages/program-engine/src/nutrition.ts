import {
  getRecommendationValue,
  matchRules,
  type EvidenceRule,
  type RuleContext,
} from "@forgefit/evidence-kb";
import { resolveAgeBand } from "./age-policy";
import {
  describeFatLossPace,
  describeRecompPriority,
  FAT_LOSS_PACE_DEFICIT_FIELD,
  fatLossPaceLabel,
  recompPriorityLabel,
  RECOMP_BASE_DEFICIT_KCAL,
  resolveFatLossPace,
  resolveRecompPriority,
} from "./body-composition";
import { resolveNutritionGoal } from "./sport";
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

function resolveBaseDeficit(
  profile: ProgramUserProfile,
  rules: EvidenceRule[]
): number {
  const pace = resolveFatLossPace(profile.fatLossPace);
  const field = FAT_LOSS_PACE_DEFICIT_FIELD[pace];
  return (
    getRecommendationValue<number>(rules, "daily_deficit_kcal", field) ?? 400
  );
}

function paceMetadata(profile: ProgramUserProfile): Pick<
  NutritionTargets,
  "fatLossPace" | "recompPriority" | "paceLabel" | "paceSummary"
> {
  const nutritionGoal = resolveNutritionGoal(profile);

  if (nutritionGoal === "fat_loss") {
    const pace = resolveFatLossPace(profile.fatLossPace);
    return {
      fatLossPace: pace,
      paceLabel: `${fatLossPaceLabel(pace)} fat loss`,
      paceSummary: describeFatLossPace(pace),
    };
  }

  if (nutritionGoal === "recomposition") {
    const priority = resolveRecompPriority(profile.recompPriority);
    return {
      recompPriority: priority,
      paceLabel: `${recompPriorityLabel(priority)} recomp`,
      paceSummary: describeRecompPriority(priority),
    };
  }

  if (profile.goal === "sport_performance") {
    if (profile.sportSeasonPhase === "in_season") {
      return {
        paceLabel: "In-season maintenance",
        paceSummary:
          "Calories matched to training and sport — no intentional deficit during competition phase.",
      };
    }
    return {
      paceLabel: "Off-season build",
      paceSummary:
        "Modest surplus supports strength and power gains between sport seasons.",
    };
  }

  return {};
}

interface CalorieResult {
  calories: number;
  calorieRuleId?: string;
  effectiveDeficitKcal?: number;
  effectiveSurplusKcal?: number;
}

function resolveCalories(
  profile: ProgramUserProfile,
  rules: EvidenceRule[],
  grossTdee: number,
  trainingKcalPerDay: number
): CalorieResult {
  const nutritionGoal = resolveNutritionGoal(profile);
  const baseDeficit = resolveBaseDeficit(profile, rules);
  const recompBaseDeficit =
    RECOMP_BASE_DEFICIT_KCAL[resolveRecompPriority(profile.recompPriority)];

  if (nutritionGoal === "sport_performance") {
    if (profile.sportSeasonPhase === "in_season") {
      return {
        calories: grossTdee,
        calorieRuleId: "sport_in_season_maintenance_calories",
      };
    }

    const surplus =
      getRecommendationValue<number>(rules, "calorie_surplus_kcal", "optimal") ??
      250;
    const eatBack = eatBackPct(rules, "gain_eat_back_pct", 0.5);
    const calories = grossTdee + surplus + trainingKcalPerDay * eatBack;
    return {
      calories,
      calorieRuleId: "sport_off_season_surplus",
      effectiveSurplusKcal: Math.round(calories - grossTdee),
    };
  }

  if (nutritionGoal === "fat_loss") {
    const eatBack = eatBackPct(rules, "eat_back_pct", 0.5);
    const calories =
      grossTdee - baseDeficit - trainingKcalPerDay * (1 - eatBack);
    return {
      calories,
      calorieRuleId: "training_eat_back_fat_loss",
      effectiveDeficitKcal: Math.round(grossTdee - calories),
    };
  }

  if (nutritionGoal === "recomposition") {
    const eatBack = eatBackPct(rules, "recomp_eat_back_pct", 0.65);
    const calories =
      grossTdee - recompBaseDeficit - trainingKcalPerDay * (1 - eatBack);
    return {
      calories,
      calorieRuleId: "recomposition_training",
      effectiveDeficitKcal: Math.round(grossTdee - calories),
    };
  }

  if (
    nutritionGoal === "bodybuilding" ||
    nutritionGoal === "general_strength" ||
    nutritionGoal === "functional_conditioning"
  ) {
    const eatBack = eatBackPct(rules, "gain_eat_back_pct", 0.5);
    const calories = grossTdee + 250 + trainingKcalPerDay * eatBack;
    return {
      calories,
      calorieRuleId: "lean_gain_rate",
      effectiveSurplusKcal: Math.round(calories - grossTdee),
    };
  }

  if (nutritionGoal === "powerlifting") {
    const eatBack = eatBackPct(rules, "gain_eat_back_pct", 0.5);
    const calories = grossTdee + 200 + trainingKcalPerDay * eatBack;
    return {
      calories,
      calorieRuleId: "lean_gain_rate",
      effectiveSurplusKcal: Math.round(calories - grossTdee),
    };
  }

  return { calories: grossTdee };
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
  const calorieResult = resolveCalories(profile, rules, tdee, 0);

  const proteinG = Math.round(proteinPerKg * profile.weightKg);
  const fatG = Math.round(fatPerKg * profile.weightKg);
  const carbsG = Math.max(
    0,
    Math.round((calorieResult.calories - proteinG * 4 - fatG * 9) / 4)
  );

  const proteinRule = rules.find((r) =>
    r.recommendation.protein_g_per_kg !== undefined
  );

  return {
    calories: Math.round(calorieResult.calories),
    proteinG,
    fatG,
    carbsG,
    proteinRuleId: proteinRule?.id ?? "protein_deficit_general",
    calorieRuleId: calorieResult.calorieRuleId,
    ...paceMetadata(profile),
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

  const calorieResult = resolveCalories(
    profile,
    rules,
    grossTdee,
    trainingKcalPerDay
  );

  const proteinG = Math.round(proteinPerKg * profile.weightKg);
  const fatG = Math.round(fatPerKg * profile.weightKg);
  const roundedCalories = Math.round(calorieResult.calories);
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
    calorieRuleId: calorieResult.calorieRuleId,
    bmrKcal,
    lifestyleKcal,
    trainingKcalPerDay,
    tdeeKcal: grossTdee,
    effectiveDeficitKcal: calorieResult.effectiveDeficitKcal,
    effectiveSurplusKcal: calorieResult.effectiveSurplusKcal,
    trainingLoad: options.trainingLoad,
    ...paceMetadata(profile),
  };
}

export function buildRuleContext(profile: ProgramUserProfile): RuleContext {
  return {
    goal: profile.goal,
    experience: profile.experience,
    age: profile.age,
    ageBand: resolveAgeBand(profile.age),
    sportId: profile.sportId,
    sportPositionId: profile.sportPositionId,
    seasonPhase: profile.sportSeasonPhase,
    secondaryGoal: profile.secondaryGoal,
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
