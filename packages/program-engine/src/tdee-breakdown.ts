import type { NutritionTargets } from "./types";

export type TdeeSegmentId =
  | "bmr"
  | "daily_life"
  | "training"
  | "goal_adjustment";

export interface TdeeSegment {
  id: TdeeSegmentId;
  label: string;
  kcal: number;
  /** Plain-language tooltip for beginners */
  hint: string;
}

export interface PlanTdeeBreakdown {
  segments: TdeeSegment[];
  tdeeKcal: number;
  targetCalories: number;
  goalAdjustmentKcal: number;
  goalLabel: "deficit" | "surplus" | "maintenance";
  isLegacyEstimate: boolean;
  calorieRuleId?: string;
  trainingRuleId?: string;
}

function goalAdjustmentLabel(adjustment: number): PlanTdeeBreakdown["goalLabel"] {
  if (adjustment <= -25) return "deficit";
  if (adjustment >= 25) return "surplus";
  return "maintenance";
}

export function buildPlanTdeeBreakdown(
  targets: NutritionTargets
): PlanTdeeBreakdown | null {
  if (!targets.calories || targets.calories <= 0) return null;

  const tdeeKcal =
    targets.tdeeKcal ??
    targets.calories +
      (targets.effectiveDeficitKcal ?? 0) -
      (targets.effectiveSurplusKcal ?? 0);

  const goalAdjustmentKcal = targets.calories - tdeeKcal;
  const goalLabel = goalAdjustmentLabel(goalAdjustmentKcal);

  if (
    targets.bmrKcal == null ||
    targets.lifestyleKcal == null ||
    targets.tdeeKcal == null
  ) {
    return {
      segments: [
        {
          id: "bmr",
          label: "Estimated maintenance",
          kcal: Math.round(tdeeKcal),
          hint:
            "A starting estimate from your profile and training schedule. Log consistently to refine this over time.",
        },
      ],
      tdeeKcal: Math.round(tdeeKcal),
      targetCalories: targets.calories,
      goalAdjustmentKcal: Math.round(goalAdjustmentKcal),
      goalLabel,
      isLegacyEstimate: true,
      calorieRuleId: targets.calorieRuleId,
    };
  }

  const dailyLifeKcal = Math.max(
    0,
    Math.round(targets.lifestyleKcal - targets.bmrKcal)
  );
  const trainingKcal = Math.max(0, Math.round(targets.trainingKcalPerDay ?? 0));

  const segments: TdeeSegment[] = [
    {
      id: "bmr",
      label: "At rest (BMR)",
      kcal: Math.round(targets.bmrKcal),
      hint:
        "Calories your body burns just to stay alive — breathing, organs, baseline metabolism.",
    },
    {
      id: "daily_life",
      label: "Daily movement",
      kcal: dailyLifeKcal,
      hint:
        "Walking, chores, fidgeting, and other activity outside planned workouts.",
    },
  ];

  if (trainingKcal > 0) {
    segments.push({
      id: "training",
      label: "Training (avg/day)",
      kcal: trainingKcal,
      hint:
        "Average burn from your planned resistance sessions, spread across the week.",
    });
  }

  if (Math.abs(goalAdjustmentKcal) >= 25) {
    segments.push({
      id: "goal_adjustment",
      label: goalLabel === "deficit" ? "Fat-loss adjustment" : "Muscle-gain adjustment",
      kcal: Math.round(Math.abs(goalAdjustmentKcal)),
      hint:
        goalLabel === "deficit"
          ? "A planned calorie reduction so you lose fat while keeping muscle."
          : "A planned calorie boost to support muscle and strength gains.",
    });
  }

  return {
    segments,
    tdeeKcal: Math.round(targets.tdeeKcal),
    targetCalories: targets.calories,
    goalAdjustmentKcal: Math.round(goalAdjustmentKcal),
    goalLabel,
    isLegacyEstimate: false,
    calorieRuleId: targets.calorieRuleId,
    trainingRuleId: "training_eee_resistance",
  };
}
