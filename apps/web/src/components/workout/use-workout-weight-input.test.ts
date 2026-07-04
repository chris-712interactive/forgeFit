import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatStoredWorkoutWeight } from "./use-workout-weight-input";

describe("formatStoredWorkoutWeight", () => {
  it("snaps imperial barbell loads to 5 lb increments for display", () => {
    const benchPressKg = 61.2349; // ~135 lb
    assert.equal(
      formatStoredWorkoutWeight("barbell_bench", benchPressKg, "imperial"),
      "135"
    );
  });

  it("snaps metric dumbbell loads to 2 kg increments", () => {
    assert.equal(formatStoredWorkoutWeight("walking_lunge", 11, "metric"), "12");
  });

  it("snaps imperial goblet squat to commercial kettlebell sizes (20, 25, 30 lb)", () => {
    assert.equal(formatStoredWorkoutWeight("goblet_squat", 9.07, "imperial"), "20");
    assert.equal(formatStoredWorkoutWeight("goblet_squat", 11.34, "imperial"), "25");
    assert.equal(formatStoredWorkoutWeight("goblet_squat", 13.61, "imperial"), "30");
  });
});
