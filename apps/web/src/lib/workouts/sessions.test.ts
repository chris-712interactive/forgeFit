import assert from "node:assert/strict";
import test from "node:test";
import type { ProgramPlan } from "@forgefit/program-engine";
import { buildDayStatusMap, type WorkoutSessionRecord } from "./sessions";
import { CUSTOM_DAY_INDEX } from "./session-source";
import {
  scheduledDateIsoForPlanDay,
  sessionDateIso,
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

test("sessionDateIso uses local calendar date, not UTC slice", () => {
  const originalTz = process.env.TZ;
  process.env.TZ = "America/Los_Angeles";

  try {
    // Tuesday July 1 8pm PDT → UTC July 2; scheduled slot is still July 1 locally.
    assert.equal(
      sessionDateIso({
        startedAt: "2026-07-02T02:00:00.000Z",
        completedAt: "2026-07-02T03:00:00.000Z",
      }),
      "2026-07-01"
    );
  } finally {
    if (originalTz === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = originalTz;
    }
  }
});

test("sessionMatchesScheduledPlanDay accepts completions logged later in the plan week", () => {
  const tuesdayPlan = {
    scheduleStartDate: "2026-06-30",
    generatedAt: "2026-06-29T12:00:00.000Z",
    week: [{ dayIndex: 1, name: "Upper" }],
  } as ProgramPlan;
  const referenceDate = new Date(2026, 6, 1, 12, 0, 0, 0);
  const completedTuesday = session({
    clientId: "tuesday-late",
    dayIndex: 1,
    status: "completed",
    startedAt: "2026-07-01T15:00:00.000Z",
    completedAt: "2026-07-01T16:00:00.000Z",
  });

  assert.equal(
    sessionMatchesScheduledPlanDay(
      completedTuesday,
      1,
      tuesdayPlan,
      referenceDate
    ),
    true
  );

  const map = buildDayStatusMap([completedTuesday], tuesdayPlan, referenceDate);
  assert.equal(map.get(1)?.latestCompleted?.clientId, "tuesday-late");
});

test("sessionMatchesScheduledPlanDay accepts evening completions on the scheduled day", () => {
  const originalTz = process.env.TZ;
  process.env.TZ = "America/Los_Angeles";

  try {
    const tuesdayPlan = {
      scheduleStartDate: "2026-06-30",
      generatedAt: "2026-06-29T12:00:00.000Z",
      week: [{ dayIndex: 1, name: "Upper" }],
    } as ProgramPlan;
    const referenceDate = new Date(2026, 6, 1, 20, 0, 0, 0);
    const completedTuesday = session({
      clientId: "tuesday-evening",
      dayIndex: 1,
      status: "completed",
      startedAt: "2026-07-02T02:00:00.000Z",
      completedAt: "2026-07-02T03:00:00.000Z",
    });

    assert.equal(
      sessionMatchesScheduledPlanDay(
        completedTuesday,
        1,
        tuesdayPlan,
        referenceDate
      ),
      true
    );

    const map = buildDayStatusMap(
      [completedTuesday],
      tuesdayPlan,
      referenceDate
    );
    assert.equal(map.get(1)?.latestCompleted?.clientId, "tuesday-evening");
  } finally {
    if (originalTz === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = originalTz;
    }
  }
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

test("buildDayStatusMap ignores custom workout sessions", () => {
  const program = {
    scheduleStartDate: "2026-06-30",
    generatedAt: "2026-06-29T12:00:00.000Z",
    week: [{ dayIndex: 1, name: "Upper" }],
  } as ProgramPlan;

  const map = buildDayStatusMap(
    [
      session({
        clientId: "program",
        dayIndex: 1,
        status: "completed",
        startedAt: "2026-07-14T10:00:00.000Z",
        completedAt: "2026-07-14T11:00:00.000Z",
      }),
      session({
        clientId: "custom",
        dayIndex: CUSTOM_DAY_INDEX,
        status: "completed",
        startedAt: "2026-07-14T12:00:00.000Z",
        completedAt: "2026-07-14T13:00:00.000Z",
      }),
    ],
    program,
    referenceDate
  );

  assert.equal(map.size, 1);
  assert.equal(map.get(1)?.latestCompleted?.clientId, "program");
});
