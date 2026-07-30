import assert from "node:assert/strict";
import test from "node:test";
import {
  canStartAssignedWorkout,
  datesReplacingProgram,
} from "./day-assignments-core";
import { suppressedProgramDayIndexes } from "./day-assignments";
import type { ProgramPlan } from "@forgefit/program-engine";

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

test("suppressedProgramDayIndexes hides all sessions when week cleared", () => {
  const plan = {
    scheduleStartDate: "2026-07-27",
    week: [
      { dayIndex: 0, name: "A" },
      { dayIndex: 2, name: "B" },
    ],
  } as unknown as ProgramPlan;

  const suppressed = suppressedProgramDayIndexes(
    plan,
    [],
    [],
    new Date("2026-07-28T12:00:00"),
    true
  );
  assert.deepEqual([...suppressed].sort((a, b) => a - b), [0, 2]);
});
