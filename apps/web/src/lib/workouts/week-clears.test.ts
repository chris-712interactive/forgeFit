import assert from "node:assert/strict";
import test from "node:test";
import type { ProgramPlan } from "@forgefit/program-engine";
import {
  clearedWeekProgramDayIndexes,
  isProgramWeekCleared,
} from "./week-clears";

function stubPlan(weekStartMonday = "2026-07-27"): ProgramPlan {
  return {
    scheduleStartDate: weekStartMonday,
    generatedAt: `${weekStartMonday}T12:00:00.000Z`,
    week: [
      { dayIndex: 0, name: "Upper", dayLabel: "Mon" },
      { dayIndex: 2, name: "Lower", dayLabel: "Wed" },
    ],
  } as ProgramPlan;
}

test("isProgramWeekCleared matches active week start", () => {
  const plan = stubPlan("2026-07-27");
  const ref = new Date(2026, 6, 29, 12, 0, 0);
  assert.equal(isProgramWeekCleared(plan, [], ref), false);
  assert.equal(isProgramWeekCleared(plan, ["2026-07-27"], ref), true);
  assert.equal(isProgramWeekCleared(plan, ["2026-07-20"], ref), false);
});

test("clearedWeekProgramDayIndexes returns all plan slots when cleared", () => {
  const plan = stubPlan("2026-07-27");
  const ref = new Date(2026, 6, 29, 12, 0, 0);
  const empty = clearedWeekProgramDayIndexes(plan, [], ref);
  assert.equal(empty.size, 0);

  const cleared = clearedWeekProgramDayIndexes(plan, ["2026-07-27"], ref);
  assert.deepEqual([...cleared].sort(), [0, 2]);
});
