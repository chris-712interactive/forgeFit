import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultCustomExerciseTargets,
  isTimedCardioExercise,
  isTimedExercise,
  resolveTimedPrescription,
} from "./holds";

test("catalog Walking, Treadmill is timed cardio in minutes", () => {
  assert.equal(isTimedCardioExercise("walking_treadmill"), true);
  assert.equal(isTimedExercise("walking_treadmill"), true);
  assert.equal(
    resolveTimedPrescription("walking_treadmill", "8-12"),
    "15-25 min"
  );
});

test("other catalog cardio machines are timed, not reps", () => {
  for (const id of [
    "jogging_treadmill",
    "running_treadmill",
    "elliptical_trainer",
    "recumbent_bike",
    "rowing_stationary",
    "stairmaster",
  ]) {
    assert.equal(isTimedCardioExercise(id), true, id);
  }
});

test("curated incline walk stays timed cardio", () => {
  assert.equal(isTimedCardioExercise("treadmill_incline_walk"), true);
});

test("strength catalog moves are not timed cardio even if names match walk/run", () => {
  assert.equal(isTimedCardioExercise("barbell_walking_lunge"), false);
  assert.equal(isTimedCardioExercise("crunches"), false);
  assert.equal(isTimedCardioExercise("barbell_bench_press_medium_grip"), false);
});

test("custom builder defaults cardio to one duration bout", () => {
  assert.deepEqual(defaultCustomExerciseTargets("walking_treadmill"), {
    sets: 1,
    reps: "15-25 min",
    restSeconds: 0,
  });
});

test("custom builder defaults strength to sets and reps", () => {
  assert.deepEqual(defaultCustomExerciseTargets("goblet_squat"), {
    sets: 3,
    reps: "8-12",
    restSeconds: 90,
  });
});

test("custom builder defaults plank to timed holds", () => {
  assert.deepEqual(defaultCustomExerciseTargets("plank"), {
    sets: 3,
    reps: "30-45 sec",
    restSeconds: 90,
  });
});
