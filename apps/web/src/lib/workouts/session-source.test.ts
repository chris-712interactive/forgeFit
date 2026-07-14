import test from "node:test";
import assert from "node:assert/strict";
import { CUSTOM_DAY_INDEX, isCustomWorkoutSession } from "./session-source";

test("isCustomWorkoutSession detects custom and imported sessions", () => {
  assert.equal(
    isCustomWorkoutSession({ dayIndex: 1, sessionSource: "program" }),
    false
  );
  assert.equal(
    isCustomWorkoutSession({ dayIndex: CUSTOM_DAY_INDEX, sessionSource: "custom" }),
    true
  );
  assert.equal(
    isCustomWorkoutSession({ dayIndex: CUSTOM_DAY_INDEX, sessionSource: "imported" }),
    true
  );
  assert.equal(
    isCustomWorkoutSession({ dayIndex: CUSTOM_DAY_INDEX }),
    true
  );
});
