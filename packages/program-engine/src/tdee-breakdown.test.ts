import assert from "node:assert/strict";
import { test } from "node:test";
import { buildPlanTdeeBreakdown } from "./tdee-breakdown";
import type { NutritionTargets } from "./types";

const layeredTargets: NutritionTargets = {
  calories: 2000,
  proteinG: 160,
  fatG: 65,
  carbsG: 200,
  proteinRuleId: "protein_deficit_general",
  calorieRuleId: "training_eat_back_fat_loss",
  bmrKcal: 1700,
  lifestyleKcal: 2300,
  trainingKcalPerDay: 350,
  tdeeKcal: 2650,
  effectiveDeficitKcal: 650,
  trainingLoad: {
    sessionsPerWeek: 4,
    weeklyEstimatedMinutes: 240,
    weeklyMainWorkMinutes: 180,
    weeklyWorkingSets: 80,
    weeklyActiveMinutes: 200,
    intensityScore: 1,
  },
};

test("buildPlanTdeeBreakdown splits layered TDEE into beginner segments", () => {
  const breakdown = buildPlanTdeeBreakdown(layeredTargets);
  assert.ok(breakdown);
  assert.equal(breakdown.isLegacyEstimate, false);
  assert.equal(breakdown.tdeeKcal, 2650);
  assert.equal(breakdown.targetCalories, 2000);
  assert.equal(breakdown.goalLabel, "deficit");
  assert.equal(
    breakdown.segments.find((segment) => segment.id === "bmr")?.kcal,
    1700
  );
  assert.equal(
    breakdown.segments.find((segment) => segment.id === "daily_life")?.kcal,
    600
  );
});

test("buildPlanTdeeBreakdown falls back for legacy targets", () => {
  const legacy: NutritionTargets = {
    calories: 2400,
    proteinG: 150,
    fatG: 70,
    carbsG: 250,
    proteinRuleId: "protein_deficit_general",
  };
  const breakdown = buildPlanTdeeBreakdown(legacy);
  assert.ok(breakdown);
  assert.equal(breakdown.isLegacyEstimate, true);
  assert.equal(breakdown.segments.length, 1);
});
