import assert from "node:assert/strict";
import test from "node:test";
import { isExerciseAvailable, isBodyweightOnlyMode } from "./availability";
import { pickExerciseForPattern } from "./index";
import type { Exercise } from "./types";

function exercise(
  partial: Pick<Exercise, "id" | "name" | "movementPattern" | "equipment"> &
    Partial<Exercise>
): Exercise {
  return {
    primaryMuscles: ["quadriceps"],
    difficulty: "beginner",
    priority: 5,
    ...partial,
  };
}

test("isBodyweightOnlyMode detects exclusive bodyweight selection", () => {
  assert.equal(isBodyweightOnlyMode(["bodyweight_only"]), true);
  assert.equal(isBodyweightOnlyMode(["bodyweight_only", "dumbbells"]), false);
  assert.equal(isBodyweightOnlyMode(["dumbbells"]), false);
});

test("load modalities are OR — goblet squat needs dumbbells or kettlebells", () => {
  const goblet = exercise({
    id: "goblet_squat",
    name: "Goblet Squat",
    movementPattern: "squat",
    equipment: ["dumbbells", "kettlebells"],
  });

  assert.equal(isExerciseAvailable(goblet, ["dumbbells"]), true);
  assert.equal(isExerciseAvailable(goblet, ["kettlebells"]), true);
  assert.equal(isExerciseAvailable(goblet, ["treadmill"]), false);
});

test("supports are AND — barbell squat needs barbell and rack", () => {
  const squat = exercise({
    id: "barbell_squat",
    name: "Barbell Back Squat",
    movementPattern: "squat",
    equipment: ["barbell", "squat_rack"],
  });

  assert.equal(isExerciseAvailable(squat, ["barbell"]), false);
  assert.equal(isExerciseAvailable(squat, ["barbell", "squat_rack"]), true);
});

test("bodyweight movements are available without ticking bodyweight_only", () => {
  const pushUp = exercise({
    id: "push_up",
    name: "Push-up",
    movementPattern: "horizontal_push",
    equipment: ["bodyweight_only"],
    primaryMuscles: ["chest"],
  });

  assert.equal(isExerciseAvailable(pushUp, ["dumbbells", "treadmill"]), true);
  assert.equal(isExerciseAvailable(pushUp, ["treadmill"]), true);
});

test("bodyweight-only users still cannot use machine-only exercises", () => {
  assert.equal(
    isExerciseAvailable(
      exercise({
        id: "hip_hinge_machine",
        name: "Back Extension",
        movementPattern: "hinge",
        equipment: ["machines"],
        primaryMuscles: ["hamstrings"],
      }),
      ["bodyweight_only"]
    ),
    false
  );
});

test("dumbbells-only can pick squat and horizontal pull", () => {
  const squat = pickExerciseForPattern("squat", ["dumbbells"], "beginner");
  const pull = pickExerciseForPattern(
    "horizontal_pull",
    ["dumbbells"],
    "beginner"
  );

  assert.equal(squat?.id, "goblet_squat");
  assert.equal(pull?.id, "dumbbell_row");
});

test("treadmill-only still gets bodyweight compounds", () => {
  const squat = pickExerciseForPattern("squat", ["treadmill"], "beginner");
  const push = pickExerciseForPattern(
    "horizontal_push",
    ["treadmill"],
    "beginner"
  );
  const pull = pickExerciseForPattern(
    "horizontal_pull",
    ["treadmill"],
    "beginner"
  );

  assert.equal(squat?.id, "bodyweight_squat");
  assert.equal(push?.id, "push_up");
  assert.equal(pull?.id, "bodyweight_row");
});
