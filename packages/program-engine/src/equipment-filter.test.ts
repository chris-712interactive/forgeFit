import assert from "node:assert/strict";
import test from "node:test";
import {
  isBodyweightOnlyMode,
  isExerciseAvailable,
  pickExerciseForPattern,
} from "@forgefit/exercise-db";

test("isBodyweightOnlyMode detects exclusive bodyweight selection", () => {
  assert.equal(isBodyweightOnlyMode(["bodyweight_only"]), true);
  assert.equal(isBodyweightOnlyMode(["bodyweight_only", "dumbbells"]), false);
  assert.equal(isBodyweightOnlyMode(["dumbbells"]), false);
});

test("bodyweight-only users do not get machine back extensions", () => {
  assert.equal(
    isExerciseAvailable(
      {
        id: "hip_hinge_machine",
        name: "Back Extension",
        movementPattern: "hinge",
        primaryMuscles: ["hamstrings"],
        equipment: ["machines"],
        difficulty: "beginner",
        priority: 5,
      },
      ["bodyweight_only"]
    ),
    false
  );
});

test("bodyweight-only users get glute bridge for hinge work", () => {
  const picked = pickExerciseForPattern(
    "hinge",
    ["bodyweight_only"],
    "beginner",
    []
  );

  assert.equal(picked?.id, "bodyweight_hip_hinge");
  assert.equal(picked?.name, "Glute Bridge");
});

test("bodyweight-only users can still get walking lunges", () => {
  assert.equal(
    isExerciseAvailable(
      {
        id: "walking_lunge",
        name: "Walking Lunge",
        movementPattern: "lunge",
        primaryMuscles: ["quadriceps"],
        equipment: ["dumbbells", "bodyweight_only"],
        difficulty: "beginner",
        priority: 6,
      },
      ["bodyweight_only"]
    ),
    true
  );
});

test("high functional bias prefers bodyweight squats over leg press when both available", () => {
  const high = pickExerciseForPattern(
    "squat",
    ["bodyweight_only", "machines"],
    "beginner",
    [],
    { functionalBias: "high" }
  );
  const low = pickExerciseForPattern(
    "squat",
    ["bodyweight_only", "machines"],
    "beginner",
    [],
    { functionalBias: "low" }
  );

  assert.equal(high?.id, "bodyweight_squat");
  assert.equal(low?.id, "leg_press");
});
