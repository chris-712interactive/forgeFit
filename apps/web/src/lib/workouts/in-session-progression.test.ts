import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildEasySetSuggestion } from "./in-session-progression";
import type { LocalExerciseSet } from "@forgefit/offline-sync";

function set(partial: Partial<LocalExerciseSet> & Pick<LocalExerciseSet, "clientId" | "setNumber">): LocalExerciseSet {
  return {
    sessionClientId: "session",
    userId: "user",
    exerciseId: "barbell_bench",
    exerciseName: "Bench press",
    completed: false,
    updatedAt: "2026-06-01T00:00:00Z",
    synced: false,
    ...partial,
  };
}

describe("buildEasySetSuggestion", () => {
  it("suggests heavier next set when easy and weight is logged", () => {
    const suggestion = buildEasySetSuggestion({
      set: set({
        clientId: "set-1",
        setNumber: 1,
        weightKg: 100,
        reps: 8,
        rir: 4,
      }),
      exerciseId: "barbell_bench",
      targetReps: "8",
      plannedSets: 3,
      plannedExtraSets: 0,
      allSetsForExercise: [
        set({ clientId: "set-1", setNumber: 1, weightKg: 100, reps: 8, rir: 4 }),
        set({ clientId: "set-2", setNumber: 2, weightKg: 100 }),
      ],
      experienceLevel: "intermediate",
      goal: "bodybuilding",
      unit: "metric",
      isDeloadWeek: false,
      estimatedE1rmKg: 140,
    });

    assert.ok(suggestion);
    assert.equal(suggestion.kind, "increase_weight");
    assert.equal(suggestion.nextSetClientId, "set-2");
    assert.ok((suggestion.suggestedWeightKg ?? 0) > 100);
  });

  it("suggests bonus set on final easy set", () => {
    const suggestion = buildEasySetSuggestion({
      set: set({
        clientId: "set-3",
        setNumber: 3,
        weightKg: 100,
        reps: 8,
        rir: 4,
        completed: true,
      }),
      exerciseId: "barbell_bench",
      targetReps: "8",
      plannedSets: 3,
      plannedExtraSets: 0,
      allSetsForExercise: [
        set({ clientId: "set-1", setNumber: 1, completed: true }),
        set({ clientId: "set-2", setNumber: 2, completed: true }),
        set({ clientId: "set-3", setNumber: 3, completed: true, rir: 4 }),
      ],
      experienceLevel: "intermediate",
      goal: "bodybuilding",
      unit: "metric",
      isDeloadWeek: false,
    });

    assert.ok(suggestion);
    assert.equal(suggestion.kind, "add_set");
  });

  it("returns null during deload week", () => {
    const suggestion = buildEasySetSuggestion({
      set: set({ clientId: "set-1", setNumber: 1, rir: 4, weightKg: 100 }),
      exerciseId: "barbell_bench",
      targetReps: "8",
      plannedSets: 3,
      plannedExtraSets: 0,
      allSetsForExercise: [set({ clientId: "set-1", setNumber: 1, rir: 4, weightKg: 100 })],
      experienceLevel: "intermediate",
      goal: "bodybuilding",
      unit: "metric",
      isDeloadWeek: true,
    });

    assert.equal(suggestion, null);
  });
});
