import assert from "node:assert/strict";
import test from "node:test";
import {
  canStartAssignedWorkout,
  datesReplacingProgram,
} from "./day-assignments-core";

test("datesReplacingProgram collects replaced dates", () => {
  const dates = datesReplacingProgram([
    {
      scheduledDateIso: "2026-07-14",
      replacesProgram: true,
    },
    {
      scheduledDateIso: "2026-07-15",
      replacesProgram: false,
    },
  ]);
  assert.equal(dates.has("2026-07-14"), true);
  assert.equal(dates.has("2026-07-15"), false);
});

test("canStartAssignedWorkout allows today and past, blocks future", () => {
  assert.equal(canStartAssignedWorkout("2026-07-14", "2026-07-14"), true);
  assert.equal(canStartAssignedWorkout("2026-07-13", "2026-07-14"), true);
  assert.equal(canStartAssignedWorkout("2026-07-15", "2026-07-14"), false);
});
