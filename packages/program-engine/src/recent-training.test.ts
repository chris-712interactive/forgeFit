import assert from "node:assert/strict";
import test from "node:test";
import { pickExerciseForPattern } from "@forgefit/exercise-db";
import { generateProgram } from "./generate";
import { sessionKind } from "./session-kind";
import type { ProgramUserProfile } from "./types";

const gymProfile: ProgramUserProfile = {
  goal: "bodybuilding",
  experience: "intermediate",
  sessionsPerWeek: 4,
  minutesPerSession: 60,
  equipment: ["barbell", "dumbbells", "bench", "squat_rack", "cables", "machines"],
  recoveryEquipment: [],
  weightKg: 80,
  heightCm: 178,
  age: 30,
  sex: "male",
};

test("recentTraining excludes specific completed exercises from regenerated sessions", () => {
  const plan = generateProgram(gymProfile, {
    recentTraining: {
      exerciseIds: ["barbell_bench"],
      muscleGroups: ["chest"],
    },
  });

  const benchAgain = plan.week.some((session) =>
    session.exercises.some((exercise) => exercise.exerciseId === "barbell_bench")
  );

  assert.equal(benchAgain, false);
});

test("week-level memory avoids repeating exercises across regenerate sessions", () => {
  const plan = generateProgram(
    {
      ...gymProfile,
      sessionsPerWeek: 3,
      goal: "general_strength",
    },
    {
      recentTraining: {
        exerciseIds: [],
        muscleGroups: [],
      },
    }
  );

  const exerciseIds = plan.week.flatMap((session) =>
    session.exercises.map((exercise) => exercise.exerciseId)
  );
  const unique = new Set(exerciseIds);

  assert.equal(unique.size, exerciseIds.length);
});

test("recentMuscleGroups deprioritize overlapping primary muscles", () => {
  const equipment = ["barbell", "dumbbells", "bench", "cables", "machines"];

  const defaultPick = pickExerciseForPattern(
    "horizontal_push",
    equipment,
    "intermediate",
    []
  );
  const deprioritized = pickExerciseForPattern(
    "horizontal_push",
    equipment,
    "intermediate",
    [],
    { recentMuscleGroups: ["chest", "triceps"] }
  );

  assert.equal(defaultPick?.id, "barbell_bench");
  assert.equal(deprioritized?.id, "cable_fly");
});

test("regenerate avoids scheduling upper the day after a completed upper session", () => {
  const profile: ProgramUserProfile = {
    ...gymProfile,
    goal: "recomposition",
    sessionsPerWeek: 4,
  };

  const plan = generateProgram(profile, {
    startDate: new Date(2026, 6, 2, 12, 0, 0),
    scheduleFromTodayOnly: true,
    recentTraining: {
      exerciseIds: [],
      muscleGroups: [],
      lastSessionKind: "upper",
    },
  });

  const firstUpcoming = [...plan.week].sort((a, b) => a.dayIndex - b.dayIndex)[0];
  assert.ok(firstUpcoming);
  assert.notEqual(sessionKind(firstUpcoming.name), "upper");
});
