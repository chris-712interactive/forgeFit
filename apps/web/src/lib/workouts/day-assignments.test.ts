import assert from "node:assert/strict";
import test from "node:test";
import type { ProgramPlan } from "@forgefit/program-engine";
import {
  dateHasProgramSession,
  suppressedProgramDayIndexes,
} from "./day-assignments";
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

const plan = {
  scheduleStartDate: "2026-07-27",
  generatedAt: "2026-07-27T12:00:00.000Z",
  week: [
    { dayIndex: 0, name: "Upper", dayLabel: "Mon" },
    { dayIndex: 2, name: "Lower", dayLabel: "Wed" },
  ],
} as ProgramPlan;

const wednesday = new Date(2026, 6, 29, 12, 0, 0, 0);

test("suppressedProgramDayIndexes hides all slots when week is cleared", () => {
  const suppressed = suppressedProgramDayIndexes(
    plan,
    [],
    [],
    wednesday,
    ["2026-07-27"]
  );
  assert.deepEqual([...suppressed].sort(), [0, 2]);
});

test("dateHasProgramSession respects week clears", () => {
  assert.equal(
    dateHasProgramSession(plan, [], "2026-07-27", wednesday, []),
    true
  );
  assert.equal(
    dateHasProgramSession(plan, [], "2026-07-27", wednesday, ["2026-07-27"]),
    false
  );
});
