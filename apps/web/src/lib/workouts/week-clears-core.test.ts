import assert from "node:assert/strict";
import test from "node:test";
import type { ProgramPlan } from "@forgefit/program-engine";
import {
  clearedWeekProgramDayIndexes,
  dateIsoInWeekRange,
  isProgramWeekCleared,
} from "./week-clears-core";

test("isProgramWeekCleared matches week start", () => {
  assert.equal(
    isProgramWeekCleared("2026-07-27", [{ weekStartIso: "2026-07-27" }]),
    true
  );
  assert.equal(
    isProgramWeekCleared("2026-07-27", [{ weekStartIso: "2026-07-20" }]),
    false
  );
  assert.equal(isProgramWeekCleared("2026-07-27", []), false);
});

test("clearedWeekProgramDayIndexes suppresses all plan sessions when cleared", () => {
  const plan = {
    week: [
      { dayIndex: 0, name: "A" },
      { dayIndex: 2, name: "B" },
      { dayIndex: 4, name: "C" },
    ],
  } as unknown as ProgramPlan;

  assert.deepEqual(
    [...clearedWeekProgramDayIndexes(plan, false)].sort(),
    []
  );
  assert.deepEqual(
    [...clearedWeekProgramDayIndexes(plan, true)].sort((a, b) => a - b),
    [0, 2, 4]
  );
});

test("dateIsoInWeekRange is inclusive", () => {
  assert.equal(dateIsoInWeekRange("2026-07-27", "2026-07-27", "2026-08-02"), true);
  assert.equal(dateIsoInWeekRange("2026-08-02", "2026-07-27", "2026-08-02"), true);
  assert.equal(dateIsoInWeekRange("2026-07-26", "2026-07-27", "2026-08-02"), false);
  assert.equal(dateIsoInWeekRange("2026-08-03", "2026-07-27", "2026-08-02"), false);
});
