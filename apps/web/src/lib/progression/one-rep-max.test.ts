import assert from "node:assert/strict";
import test from "node:test";
import {
  buildExerciseE1rmMap,
  estimateE1rmFromSet,
  mergeEffectiveE1rmMap,
} from "./one-rep-max.ts";
import type { WorkoutSessionRecord } from "@/lib/workouts/sessions";

test("estimateE1rmFromSet treats a true single as the actual 1RM", () => {
  assert.equal(estimateE1rmFromSet(100, 1, 0), 100);
  assert.equal(estimateE1rmFromSet(100, 1), 100);
});

test("estimateE1rmFromSet still estimates when a single has RIR left", () => {
  assert.ok(estimateE1rmFromSet(100, 1, 2) > 100);
  assert.equal(estimateE1rmFromSet(100, 1, 2), 100 * (1 + 3 / 30));
});

test("estimateE1rmFromSet uses Epley for multi-rep sets", () => {
  assert.equal(estimateE1rmFromSet(100, 5, 0), 100 * (1 + 5 / 30));
});

test("mergeEffectiveE1rmMap keeps declared max when estimate is only slightly higher", () => {
  const declared = new Map([["barbell_bench", 100]]);
  const estimated = new Map([["barbell_bench", 100.2]]);
  const merged = mergeEffectiveE1rmMap(declared, estimated);
  assert.deepEqual(merged.get("barbell_bench"), {
    e1rmKg: 100,
    source: "user_declared",
  });
});

test("mergeEffectiveE1rmMap lets a clearly higher log estimate raise the max", () => {
  const declared = new Map([["barbell_bench", 100]]);
  const estimated = new Map([["barbell_bench", 110]]);
  const merged = mergeEffectiveE1rmMap(declared, estimated);
  assert.deepEqual(merged.get("barbell_bench"), {
    e1rmKg: 110,
    source: "blended",
  });
});

test("buildExerciseE1rmMap ignores max-test sessions so warmups cannot inflate", () => {
  const sessions: WorkoutSessionRecord[] = [
    {
      id: "max-1",
      clientId: "max-1",
      dayIndex: 0,
      sessionName: "1RM Test: Barbell Bench",
      status: "completed",
      startedAt: "2026-08-11T12:00:00.000Z",
      completedAt: "2026-08-11T12:30:00.000Z",
      sets: [
        {
          exerciseId: "barbell_bench",
          exerciseName: "Barbell Bench",
          setNumber: 1,
          reps: 3,
          weightKg: 95,
          rir: 0,
          completed: true,
        },
        {
          exerciseId: "barbell_bench",
          exerciseName: "Barbell Bench",
          setNumber: 2,
          reps: 1,
          weightKg: 100,
          rir: 0,
          completed: true,
        },
      ],
    },
    {
      id: "train-1",
      clientId: "train-1",
      dayIndex: 1,
      sessionName: "Upper A",
      status: "completed",
      startedAt: "2026-08-10T12:00:00.000Z",
      completedAt: "2026-08-10T12:45:00.000Z",
      sets: [
        {
          exerciseId: "barbell_bench",
          exerciseName: "Barbell Bench",
          setNumber: 1,
          reps: 5,
          weightKg: 80,
          rir: 1,
          completed: true,
        },
      ],
    },
  ];

  const map = buildExerciseE1rmMap(sessions);
  // Only the training session contributes: 80 × (1 + 6/30)
  assert.equal(map.get("barbell_bench"), 80 * (1 + 6 / 30));
});
