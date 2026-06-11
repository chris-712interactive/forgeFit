import assert from "node:assert/strict";
import test from "node:test";
import { computeTrainingLoad } from "./training-load";
import type { WorkoutSession } from "./types";

function fixtureSession(overrides: Partial<WorkoutSession> = {}): WorkoutSession {
  return {
    dayIndex: 0,
    dayLabel: "Mon",
    name: "Full Body",
    estimatedMinutes: 60,
    warmupBlock: {
      name: "Full-body prep",
      durationMinutes: 5,
      focus: "full_body",
      movements: [],
    },
    recoveryBlock: {
      name: "Foam Roll & Mobility",
      durationMinutes: 6,
      equipment: "foam_roller",
    },
    exercises: [
      {
        exerciseId: "squat",
        name: "Squat",
        primaryMuscles: ["quads"],
        sets: 4,
        reps: "8-12",
        restSeconds: 90,
      },
      {
        exerciseId: "row",
        name: "Row",
        primaryMuscles: ["back"],
        sets: 3,
        reps: "8-12",
        restSeconds: 90,
      },
    ],
    citationRuleIds: [],
    ...overrides,
  };
}

test("computeTrainingLoad aggregates weekly session metrics", () => {
  const week = [
    fixtureSession({ estimatedMinutes: 60 }),
    fixtureSession({ dayIndex: 2, estimatedMinutes: 45, exercises: [] }),
  ];

  const load = computeTrainingLoad(week);

  assert.equal(load.sessionsPerWeek, 2);
  assert.equal(load.weeklyEstimatedMinutes, 105);
  assert.equal(load.weeklyWorkingSets, 7);
  assert.ok(load.weeklyActiveMinutes > 0);
  assert.ok(load.intensityScore >= 0.85 && load.intensityScore <= 1.15);
});
