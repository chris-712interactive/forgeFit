import assert from "node:assert/strict";
import test from "node:test";
import { generateProgram } from "./generate";
import type { ProgramUserProfile } from "./types";

const baseProfile: ProgramUserProfile = {
  goal: "bodybuilding",
  experience: "intermediate",
  sessionsPerWeek: 6,
  minutesPerSession: 60,
  equipment: ["barbell", "dumbbells", "bench", "squat_rack", "cables", "machines"],
  recoveryEquipment: [],
  weightKg: 80,
  heightCm: 178,
  age: 30,
  sex: "male",
  activityLevel: "moderately_active",
};

test("bodybuilding arms session keeps a compound pull for joint balance", () => {
  const plan = generateProgram(baseProfile);
  const armsSession = plan.week.find((session) => session.name === "Arms & Core");

  assert.ok(armsSession);
  assert.ok(
    armsSession.exercises.some((exercise) =>
      ["barbell_row", "dumbbell_row", "cable_row", "pull_up", "lat_pulldown"].includes(
        exercise.exerciseId
      )
    ),
    "expected at least one horizontal pull compound in Arms & Core"
  );
});

test("general strength programs include carry work when equipment allows", () => {
  const plan = generateProgram({
    ...baseProfile,
    goal: "general_strength",
    sessionsPerWeek: 4,
    equipment: ["dumbbells", "kettlebells"],
  });

  assert.ok(
    plan.week.some((session) =>
      session.exercises.some((exercise) =>
        ["farmers_walk", "suitcase_carry"].includes(exercise.exerciseId)
      )
    )
  );
});

test("every bodybuilding session meets the compound floor", () => {
  const plan = generateProgram(baseProfile);

  for (const session of plan.week) {
    const compounds = session.exercises.filter((exercise) =>
      [
        "barbell_squat",
        "goblet_squat",
        "leg_press",
        "bodyweight_squat",
        "barbell_deadlift",
        "romanian_deadlift",
        "hip_hinge_machine",
        "bodyweight_hip_hinge",
        "barbell_bench",
        "dumbbell_bench",
        "push_up",
        "overhead_press",
        "machine_shoulder_press",
        "barbell_row",
        "dumbbell_row",
        "cable_row",
        "pull_up",
        "lat_pulldown",
        "walking_lunge",
        "farmers_walk",
        "suitcase_carry",
      ].includes(exercise.exerciseId)
    );

    assert.ok(
      compounds.length >= 2,
      `${session.name} should include at least 2 compound patterns`
    );
  }
});
