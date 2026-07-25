import assert from "node:assert/strict";
import test from "node:test";
import { generateProgram } from "./generate";
import type { ProgramUserProfile } from "./types";

function fatLossProfile(
  equipment: string[],
  overrides: Partial<ProgramUserProfile> = {}
): ProgramUserProfile {
  return {
    goal: "fat_loss",
    experience: "beginner",
    sessionsPerWeek: 4,
    minutesPerSession: 45,
    weightKg: 90,
    heightCm: 180,
    age: 30,
    sex: "male",
    equipment,
    recoveryEquipment: ["foam_roller"],
    fatLossPace: "aggressive",
    ...overrides,
  };
}

function strengthNames(session: { exercises: { name: string; primaryMuscles: string[] }[] }) {
  return session.exercises
    .filter((exercise) => exercise.primaryMuscles[0] !== "cardio")
    .map((exercise) => exercise.name);
}

test("fat_loss with treadmill still includes strength work, not cardio-only", () => {
  const plan = generateProgram(fatLossProfile(["treadmill"]));

  for (const session of plan.week) {
    const strength = strengthNames(session);
    assert.ok(
      strength.length >= 2,
      `${session.name} should have strength lifts, got: ${session.exercises.map((e) => e.name).join(", ")}`
    );
    assert.ok(
      session.exercises.some((exercise) => exercise.name === "Incline Walk"),
      `${session.name} should still append fat-loss cardio`
    );
  }
});

test("fat_loss with dumbbells + treadmill is not incline-walk-only", () => {
  const plan = generateProgram(fatLossProfile(["dumbbells", "treadmill"]));
  const session = plan.week[0]!;
  const strength = strengthNames(session);

  assert.ok(strength.length >= 2, `got only: ${session.exercises.map((e) => e.name).join(", ")}`);
  assert.ok(session.exercises.some((exercise) => exercise.name === "Incline Walk"));
  assert.ok(session.estimatedMinutes > 20);
});

test("legacy cardio_machines expands but still builds full-body strength", () => {
  const plan = generateProgram(fatLossProfile(["cardio_machines"]));
  const session = plan.week[0]!;
  assert.ok(strengthNames(session).length >= 2);
});
