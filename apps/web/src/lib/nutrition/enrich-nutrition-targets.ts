import { getRules } from "@forgefit/evidence-kb";
import {
  computeNutrition,
  computeTrainingLoad,
  estimateTrainingExpenditure,
  getMatchedRules,
  type NutritionTargets,
  type ProgramPlan,
  type ProgramUserProfile,
} from "@forgefit/program-engine";

export function hasLayeredNutritionFields(
  targets: NutritionTargets | null | undefined
): boolean {
  if (!targets) return false;
  return (
    targets.bmrKcal != null &&
    targets.lifestyleKcal != null &&
    targets.tdeeKcal != null
  );
}

/** Fill BMR / lifestyle / TDEE fields when an older stored program omitted them. */
export function enrichNutritionTargets(
  plan: ProgramPlan,
  profile: ProgramUserProfile
): NutritionTargets {
  if (hasLayeredNutritionFields(plan.nutrition)) {
    return plan.nutrition;
  }

  const rules = getMatchedRules(getRules(), profile);
  const trainingLoad =
    plan.nutrition.trainingLoad ?? computeTrainingLoad(plan.week);
  const expenditure = estimateTrainingExpenditure(
    plan.week,
    trainingLoad,
    profile
  );
  const computed = computeNutrition(profile, rules, {
    trainingLoad,
    expenditure,
  });

  return {
    ...computed,
    calories: plan.nutrition.calories,
    proteinG: plan.nutrition.proteinG,
    fatG: plan.nutrition.fatG,
    carbsG: plan.nutrition.carbsG,
    proteinRuleId: plan.nutrition.proteinRuleId ?? computed.proteinRuleId,
    calorieRuleId: plan.nutrition.calorieRuleId ?? computed.calorieRuleId,
  };
}
