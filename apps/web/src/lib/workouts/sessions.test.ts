import assert from "node:assert/strict";
import test from "node:test";
import type { ProgramPlan } from "@forgefit/program-engine";
import { buildDayStatusMap, type WorkoutSessionRecord } from "./sessions";
import {
  scheduledDateIsoForPlanDay,
  sessionMatchesScheduledPlanDay,
} from "./schedule-dates";

const regeneratedPlan = {
  scheduleStartDate: "2026-06-30",
  generatedAt: "2026-06-29T12:00:00.000Z",
  week: [
    { dayIndex: 1, name: "Upper" },
    { dayIndex: 3, name: "Lower" },
    { dayIndex: 4, name: "Upper" },
  ],
} as ProgramPlan;

const referenceDate = new Date(2026, 5, 29, 12, 0, 0, 0);

function session(
  partial: Pick<
    WorkoutSessionRecord,
    "dayIndex" | "status" | "startedAt" | "completedAt" | "clientId"
  >
): WorkoutSessionRecord {
  return {
    id: partial.clientId,
    sessionName: "Test",
    sets: [{ exerciseId: "sq", exerciseName: "Squat", setNumber: 1, completed: true }],
    ...partial,
  };
}

test("scheduledDateIsoForPlanDay maps dayIndex to the plan week calendar date", () => {
  assert.equal(
    scheduledDateIsoForPlanDay(3, regeneratedPlan, referenceDate),
    "2026-07-02"
  );
});

test("sessionMatchesScheduledPlanDay rejects prior-week completions with same weekday index", () => {
  const oldLower = session({
    clientId: "old-lower",
    dayIndex: 3,
    status: "completed",
    startedAt: "2026-06-18T10:00:00.000Z",
    completedAt: "2026-06-18T11:00:00.000Z",
  });

  assert.equal(
    sessionMatchesScheduledPlanDay(oldLower, 3, regeneratedPlan, referenceDate),
    false
  );
});

test("buildDayStatusMap only marks current plan week sessions as completed", () => {
  const oldLower = session({
    clientId: "old-lower",
    dayIndex: 3,
    status: "completed",
    startedAt: "2026-06-18T10:00:00.000Z",
    completedAt: "2026-06-18T11:00:00.000Z",
  });
  const oldUpper = session({
    clientId: "old-upper",
    dayIndex: 4,
    status: "completed",
    startedAt: "2026-06-19T10:00:00.000Z",
    completedAt: "2026-06-19T11:00:00.000Z",
  });

  const map = buildDayStatusMap([oldLower, oldUpper], regeneratedPlan, referenceDate);

  assert.equal(map.get(3)?.latestCompleted, null);
  assert.equal(map.get(4)?.latestCompleted, null);
  assert.equal(map.get(3)?.priorCompleted.length, 1);
  assert.equal(map.get(4)?.priorCompleted.length, 1);
});
