import assert from "node:assert/strict";
import test from "node:test";
import type { ProgramPlan } from "@forgefit/program-engine";
import type { WorkoutSessionRecord } from "@/lib/workouts/sessions";
import {
  buildRecentTrainingContextFromSessions,
  findMostRecentCompletedSessionKind,
  findYesterdayCompletedSessionKind,
  inferAvoidKindFromPriorPlan,
  planReferenceDateForRecentTraining,
  resolveAvoidSessionKindForRegenerate,
} from "./recent-training";

const priorPlan = {
  scheduleStartDate: "2026-06-30",
  generatedAt: "2026-06-29T12:00:00.000Z",
  week: [
    { dayIndex: 0, name: "Lower" },
    { dayIndex: 2, name: "Upper" },
    { dayIndex: 4, name: "Full" },
  ],
} as ProgramPlan;

function session(
  partial: Pick<
    WorkoutSessionRecord,
    "dayIndex" | "status" | "startedAt" | "completedAt" | "clientId" | "sets"
  >
): WorkoutSessionRecord {
  return {
    id: partial.clientId,
    sessionName: "Test",
    sets: partial.sets,
    ...partial,
  };
}

test("buildRecentTrainingContextFromSessions includes only prior-week completions before start date", () => {
  const startDate = new Date(2026, 5, 29, 12, 0, 0, 0);
  const referenceDate = new Date(2026, 5, 29, 12, 0, 0, 0);

  const mondayLower = session({
    clientId: "mon-lower",
    dayIndex: 0,
    status: "completed",
    startedAt: "2026-06-30T10:00:00.000Z",
    completedAt: "2026-06-30T11:00:00.000Z",
    sets: [
      {
        exerciseId: "barbell_squat",
        exerciseName: "Barbell Squat",
        setNumber: 1,
        completed: true,
      },
    ],
  });

  const oldWeek = session({
    clientId: "old-week",
    dayIndex: 0,
    status: "completed",
    startedAt: "2026-06-18T10:00:00.000Z",
    completedAt: "2026-06-18T11:00:00.000Z",
    sets: [
      {
        exerciseId: "leg_press",
        exerciseName: "Leg Press",
        setNumber: 1,
        completed: true,
      },
    ],
  });

  const sameDayFuture = session({
    clientId: "same-day",
    dayIndex: 2,
    status: "completed",
    startedAt: "2026-07-02T18:00:00.000Z",
    completedAt: "2026-07-02T19:00:00.000Z",
    sets: [
      {
        exerciseId: "barbell_bench",
        exerciseName: "Barbell Bench",
        setNumber: 1,
        completed: true,
      },
    ],
  });

  const context = buildRecentTrainingContextFromSessions(
    [mondayLower, oldWeek, sameDayFuture],
    priorPlan,
    startDate,
    referenceDate
  );

  assert.deepEqual(context.exerciseIds, ["barbell_squat"]);
  assert.ok(context.muscleGroups.includes("quadriceps"));
  assert.ok(!context.muscleGroups.includes("chest"));
});

test("findYesterdayCompletedSessionKind prefers yesterday over older sessions", () => {
  const startDate = new Date(2026, 6, 2, 12, 0, 0, 0);
  const yesterdayUpper = session({
    clientId: "yesterday-upper",
    dayIndex: 4,
    status: "completed",
    startedAt: "2026-07-01T10:00:00.000Z",
    completedAt: "2026-07-01T11:00:00.000Z",
    sets: [],
  });
  yesterdayUpper.sessionName = "Upper";

  const olderLower = session({
    clientId: "older-lower",
    dayIndex: 0,
    status: "completed",
    startedAt: "2026-06-28T10:00:00.000Z",
    completedAt: "2026-06-28T11:00:00.000Z",
    sets: [],
  });
  olderLower.sessionName = "Lower";

  assert.equal(
    findYesterdayCompletedSessionKind([olderLower, yesterdayUpper], startDate),
    "upper"
  );
  assert.equal(
    resolveLastSessionKindForRegenerate([olderLower, yesterdayUpper], startDate),
    "upper"
  );
});

test("findMostRecentCompletedSessionKind uses calendar date, not plan slot matching", () => {
  const startDate = new Date(2026, 6, 2, 12, 0, 0, 0);
  const yesterdayUpper = session({
    clientId: "yesterday-upper",
    dayIndex: 4,
    status: "completed",
    startedAt: "2026-07-01T10:00:00.000Z",
    completedAt: "2026-07-01T11:00:00.000Z",
    sets: [],
  });
  yesterdayUpper.sessionName = "Upper";

  assert.equal(
    findMostRecentCompletedSessionKind([yesterdayUpper], startDate),
    "upper"
  );
});

test("buildRecentTrainingContextFromSessions captures last completed session kind", () => {
  const startDate = new Date(2026, 6, 2, 12, 0, 0, 0);
  const referenceDate = new Date(2026, 6, 2, 12, 0, 0, 0);

  const tuesdayLower = session({
    clientId: "tue-lower",
    dayIndex: 1,
    status: "completed",
    startedAt: "2026-07-01T10:00:00.000Z",
    completedAt: "2026-07-01T11:00:00.000Z",
    sets: [],
  });
  tuesdayLower.sessionName = "Lower";

  const context = buildRecentTrainingContextFromSessions(
    [tuesdayLower],
    priorPlan,
    startDate,
    referenceDate
  );

  assert.equal(context.lastSessionKind, "lower");
});

test("inferAvoidKindFromPriorPlan uses yesterday plan slot when logs are missing", () => {
  const startDate = new Date(2026, 6, 2, 12, 0, 0, 0);
  const priorPlanWithWednesdayUpper = {
    week: [
      { dayIndex: 2, name: "Upper" },
      { dayIndex: 4, name: "Lower" },
    ],
  } as ProgramPlan;

  assert.equal(
    inferAvoidKindFromPriorPlan(priorPlanWithWednesdayUpper, startDate),
    "upper"
  );
  assert.equal(
    resolveAvoidSessionKindForRegenerate([], priorPlanWithWednesdayUpper, startDate),
    "upper"
  );
});

test("planReferenceDateForRecentTraining uses plan start when regenerate starts later", () => {
  const startDate = new Date(2026, 6, 2, 12, 0, 0, 0);
  const ref = planReferenceDateForRecentTraining(priorPlan, startDate);
  assert.equal(ref.toISOString().slice(0, 10), "2026-06-30");
});
