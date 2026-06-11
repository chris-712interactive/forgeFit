import assert from "node:assert/strict";
import test from "node:test";
import { getRules } from "@forgefit/evidence-kb";
import { generateProgram } from "./generate";
import { computeNutrition, getMatchedRules } from "./nutrition";
import { computeTrainingLoad } from "./training-load";
import { estimateTrainingExpenditure } from "./training-expenditure";
import type { ProgramUserProfile } from "./types";

const baseProfile: ProgramUserProfile = {
  goal: "fat_loss",
  experience: "beginner",
  sessionsPerWeek: 5,
  minutesPerSession: 60,
  weightKg: 80,
  heightCm: 180,
  age: 30,
  sex: "male",
  equipment: ["barbell", "dumbbells", "bench", "squat_rack"],
  recoveryEquipment: ["foam_roller"],
};

test("fat loss nutrition increases effective deficit with higher training volume", () => {
  const rules = getMatchedRules(getRules(), baseProfile);

  const lightPlan = generateProgram({
    ...baseProfile,
    sessionsPerWeek: 3,
    minutesPerSession: 30,
  });
  const heavyPlan = generateProgram(baseProfile);

  assert.ok(
    (heavyPlan.nutrition.effectiveDeficitKcal ?? 0) >
      (lightPlan.nutrition.effectiveDeficitKcal ?? 0)
  );
  assert.ok(
    (heavyPlan.nutrition.trainingKcalPerDay ?? 0) >
      (lightPlan.nutrition.trainingKcalPerDay ?? 0)
  );
  assert.ok(heavyPlan.nutrition.calories > lightPlan.nutrition.calories);
});

test("computeNutrition falls back to legacy targets without training context", () => {
  const rules = getMatchedRules(getRules(), baseProfile);
  const legacy = computeNutrition(baseProfile, rules);

  assert.equal(legacy.trainingKcalPerDay, undefined);
  assert.equal(legacy.effectiveDeficitKcal, undefined);
  assert.ok(legacy.calories > 0);
});

test("computeNutrition exposes layered TDEE fields with training context", () => {
  const rules = getMatchedRules(getRules(), baseProfile);
  const plan = generateProgram(baseProfile);
  const load = computeTrainingLoad(plan.week);
  const expenditure = estimateTrainingExpenditure(plan.week, load, baseProfile);
  const nutrition = computeNutrition(baseProfile, rules, {
    trainingLoad: load,
    expenditure,
  });

  assert.ok(nutrition.bmrKcal && nutrition.bmrKcal > 0);
  assert.ok(nutrition.lifestyleKcal && nutrition.lifestyleKcal > 0);
  assert.ok(nutrition.trainingKcalPerDay && nutrition.trainingKcalPerDay > 0);
  assert.ok(nutrition.tdeeKcal && nutrition.tdeeKcal > nutrition.lifestyleKcal);
  assert.ok(
    nutrition.effectiveDeficitKcal && nutrition.effectiveDeficitKcal > 400
  );
});
