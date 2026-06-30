import assert from "node:assert/strict";
import test from "node:test";
import type { ProgramPlan } from "@forgefit/program-engine";
import {
  canStartPlanSession,
  formatPlanSessionDate,
  planScheduleReferenceDate,
} from "./schedule-dates";

const futurePlan = {
  scheduleStartDate: "2026-07-14",
  generatedAt: "2026-07-07T12:00:00.000Z",
  week: [{ dayIndex: 1, name: "Full Body A" }],
} as ProgramPlan;

test("planScheduleReferenceDate uses start week before the plan begins", () => {
  const reference = planScheduleReferenceDate(
    futurePlan,
    new Date(2026, 6, 7, 12, 0, 0, 0)
  );

  assert.equal(reference.getDay(), 2);
});

test("formatPlanSessionDate shows the start-week calendar day before activation", () => {
  const label = formatPlanSessionDate(
    1,
    futurePlan,
    new Date(2026, 6, 7, 12, 0, 0, 0)
  );

  assert.match(label, /Jul/);
  assert.match(label, /14/);
});

test("canStartPlanSession blocks workouts before scheduleStartDate", () => {
  assert.equal(
    canStartPlanSession(1, futurePlan, new Date(2026, 6, 7, 12, 0, 0, 0)),
    false
  );
  assert.equal(
    canStartPlanSession(1, futurePlan, new Date(2026, 6, 14, 12, 0, 0, 0)),
    true
  );
});
