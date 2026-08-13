import assert from "node:assert/strict";
import test from "node:test";
import type { WorkoutSessionRecord, WorkoutSetRecord } from "./sessions";
import {
  findLastLoggedSet,
  formatLastLoggedSetHint,
} from "./last-logged-set";

function set(
  partial: Partial<WorkoutSetRecord> &
    Pick<WorkoutSetRecord, "exerciseId" | "exerciseName">
): WorkoutSetRecord {
  return {
    setNumber: 1,
    completed: true,
    reps: 8,
    weightKg: 80,
    ...partial,
  };
}

function session(
  partial: Pick<WorkoutSessionRecord, "clientId" | "status" | "startedAt"> &
    Partial<WorkoutSessionRecord>
): WorkoutSessionRecord {
  return {
    id: partial.clientId,
    dayIndex: 1,
    sessionName: "Test",
    completedAt: partial.completedAt ?? partial.startedAt,
    sets: [],
    ...partial,
  };
}

test("findLastLoggedSet returns the newest completed session's best set", () => {
  const older = session({
    clientId: "older",
    status: "completed",
    startedAt: "2026-08-01T10:00:00.000Z",
    sets: [
      set({ exerciseId: "goblet_squat", exerciseName: "Goblet Squat", weightKg: 24, reps: 10 }),
    ],
  });
  const newer = session({
    clientId: "newer",
    status: "completed",
    startedAt: "2026-08-10T10:00:00.000Z",
    sets: [
      set({ exerciseId: "goblet_squat", exerciseName: "Goblet Squat", weightKg: 28, reps: 8, setNumber: 1 }),
      set({ exerciseId: "goblet_squat", exerciseName: "Goblet Squat", weightKg: 32, reps: 6, setNumber: 2 }),
    ],
  });
  const current = session({
    clientId: "current",
    status: "in_progress",
    startedAt: "2026-08-13T10:00:00.000Z",
    sets: [],
  });

  const last = findLastLoggedSet([current, older, newer], "goblet_squat", {
    excludeClientId: "current",
  });

  assert.equal(last?.weightKg, 32);
  assert.equal(last?.reps, 6);
  assert.equal(last?.completedAt, "2026-08-10T10:00:00.000Z");
});

test("findLastLoggedSet ignores other exercises and incomplete sets", () => {
  const last = findLastLoggedSet(
    [
      session({
        clientId: "a",
        status: "completed",
        startedAt: "2026-08-10T10:00:00.000Z",
        sets: [
          set({
            exerciseId: "barbell_bench",
            exerciseName: "Bench",
            weightKg: 100,
            reps: 5,
          }),
          set({
            exerciseId: "goblet_squat",
            exerciseName: "Goblet Squat",
            completed: false,
            weightKg: 40,
            reps: 8,
          }),
        ],
      }),
    ],
    "goblet_squat"
  );

  assert.equal(last, null);
});

test("findLastLoggedSet matches plannedExerciseId and exercise name", () => {
  const byPlan = findLastLoggedSet(
    [
      session({
        clientId: "swap",
        status: "completed",
        startedAt: "2026-08-10T10:00:00.000Z",
        sets: [
          set({
            exerciseId: "dumbbell_bench",
            plannedExerciseId: "barbell_bench",
            exerciseName: "Dumbbell Bench Press",
            weightKg: 30,
            reps: 10,
          }),
        ],
      }),
    ],
    "barbell_bench"
  );
  assert.equal(byPlan?.weightKg, 30);

  const byName = findLastLoggedSet(
    [
      session({
        clientId: "named",
        status: "completed",
        startedAt: "2026-08-11T10:00:00.000Z",
        sets: [
          set({
            exerciseId: "custom:goblet_squat",
            exerciseName: "Goblet Squat",
            weightKg: 28,
            reps: 10,
          }),
        ],
      }),
    ],
    "goblet_squat",
    { exerciseName: "Goblet Squat" }
  );
  assert.equal(byName?.weightKg, 28);
  assert.equal(byName?.reps, 10);
});

test("formatLastLoggedSetHint includes date and load", () => {
  const label = formatLastLoggedSetHint(
    {
      exerciseId: "goblet_squat",
      weightKg: 32,
      reps: 6,
      completedAt: "2026-08-10T10:00:00.000Z",
    },
    "metric"
  );

  assert.match(label ?? "", /Last time/);
  assert.match(label ?? "", /Aug/);
  assert.match(label ?? "", /32 kg/);
  assert.match(label ?? "", /6/);
});
