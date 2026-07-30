import assert from "node:assert/strict";
import test from "node:test";
import type { ProgramPlan, WorkoutSession } from "@forgefit/program-engine";
import {
  isProgramWeekCleared,
  programWeekSlots,
  suppressedProgramDayIndexesForWeek,
  validateWeekReplaceAssignments,
  weekDateRange,
} from "./week-program-clear-core";

function session(dayIndex: number, name: string): WorkoutSession {
  return {
    dayIndex,
    dayLabel: "Day",
    name,
    estimatedMinutes: 45,
    exercises: [],
    citationRuleIds: [],
  };
}

const plan = {
  scheduleStartDate: "2026-07-27",
  generatedAt: "2026-07-27T12:00:00.000Z",
  week: [session(0, "A"), session(2, "B"), session(4, "C")],
} as ProgramPlan;

test("weekDateRange returns Mon–Sun", () => {
  assert.deepEqual(weekDateRange("2026-07-27"), [
    "2026-07-27",
    "2026-07-28",
    "2026-07-29",
    "2026-07-30",
    "2026-07-31",
    "2026-08-01",
    "2026-08-02",
  ]);
});

test("isProgramWeekCleared matches week start", () => {
  assert.equal(isProgramWeekCleared("2026-07-27", ["2026-07-27"]), true);
  assert.equal(isProgramWeekCleared("2026-07-27", ["2026-07-20"]), false);
});

test("suppressedProgramDayIndexesForWeek hides all days when week cleared", () => {
  const suppressed = suppressedProgramDayIndexesForWeek({
    plan,
    overrides: [],
    assignments: [],
    weekStartIso: "2026-07-27",
    clearedWeekStarts: ["2026-07-27"],
    referenceDate: new Date(2026, 6, 28, 12, 0, 0, 0),
  });
  assert.deepEqual([...suppressed].sort((a, b) => a - b), [0, 2, 4]);
});

test("suppressedProgramDayIndexesForWeek uses replacesProgram when not cleared", () => {
  const partial = {
    ...plan,
    week: [session(0, "A"), session(2, "B")],
  } as ProgramPlan;
  const suppressed = suppressedProgramDayIndexesForWeek({
    plan: partial,
    overrides: [],
    assignments: [
      { scheduledDateIso: "2026-07-27", replacesProgram: true },
      { scheduledDateIso: "2026-07-29", replacesProgram: false },
    ],
    weekStartIso: "2026-07-27",
    clearedWeekStarts: [],
    referenceDate: new Date(2026, 6, 28, 12, 0, 0, 0),
  });
  assert.equal(suppressed.has(0), true);
  assert.equal(suppressed.has(2), false);
});

test("validateWeekReplaceAssignments rejects out-of-week dates", () => {
  const result = validateWeekReplaceAssignments("2026-07-27", [
    {
      scheduledDateIso: "2026-08-03",
      templateId: "11111111-1111-1111-1111-111111111111",
    },
  ]);
  assert.equal(result.ok, false);
});

test("validateWeekReplaceAssignments accepts in-week unique dates", () => {
  const result = validateWeekReplaceAssignments("2026-07-27", [
    {
      scheduledDateIso: "2026-07-28",
      templateId: "11111111-1111-1111-1111-111111111111",
    },
    {
      scheduledDateIso: "2026-07-30",
      templateId: "22222222-2222-2222-2222-222222222222",
    },
  ]);
  assert.equal(result.ok, true);
});

test("programWeekSlots sorts by effective date", () => {
  const unsorted = {
    ...plan,
    week: [session(4, "Fri"), session(0, "Mon")],
  } as ProgramPlan;
  const slots = programWeekSlots(
    unsorted,
    [],
    new Date(2026, 6, 28, 12, 0, 0, 0)
  );
  assert.equal(slots[0]?.dayIndex, 0);
  assert.equal(slots[1]?.dayIndex, 4);
});
