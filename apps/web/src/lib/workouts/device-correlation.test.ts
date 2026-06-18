import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ExerciseSessionSummary } from "@forgefit/integrations";
import {
  confidenceFromOverlap,
  findBestExerciseMatch,
  overlapRatioForWindows,
} from "./device-correlation";

function exercise(
  id: string,
  start: string,
  end: string,
  type: string | null = "WEIGHT_TRAINING"
): ExerciseSessionSummary {
  return {
    externalId: id,
    startedAt: start,
    completedAt: end,
    exerciseType: type,
    displayName: null,
    durationSeconds: 3600,
    avgHeartRateBpm: 120,
    activeZoneMinutes: 10,
    caloriesKcal: 200,
    zoneDurations: {
      lightSeconds: null,
      fatBurnSeconds: null,
      cardioSeconds: null,
      peakSeconds: null,
    },
    rawSummary: {},
  };
}

describe("overlapRatioForWindows", () => {
  it("returns 1 for identical windows", () => {
    const ratio = overlapRatioForWindows(
      Date.parse("2026-06-01T10:00:00Z"),
      Date.parse("2026-06-01T11:00:00Z"),
      Date.parse("2026-06-01T10:00:00Z"),
      Date.parse("2026-06-01T11:00:00Z")
    );
    assert.equal(ratio, 1);
  });

  it("returns 0 for non-overlapping windows", () => {
    const ratio = overlapRatioForWindows(
      Date.parse("2026-06-01T10:00:00Z"),
      Date.parse("2026-06-01T11:00:00Z"),
      Date.parse("2026-06-01T12:00:00Z"),
      Date.parse("2026-06-01T13:00:00Z")
    );
    assert.equal(ratio, 0);
  });
});

describe("confidenceFromOverlap", () => {
  it("maps thresholds", () => {
    assert.equal(confidenceFromOverlap(0.8), "high");
    assert.equal(confidenceFromOverlap(0.6), "medium");
    assert.equal(confidenceFromOverlap(0.45), "low");
    assert.equal(confidenceFromOverlap(0.2), "none");
  });
});

describe("findBestExerciseMatch", () => {
  it("prefers weight training type on tie overlap", () => {
    const match = findBestExerciseMatch(
      {
        id: "session-1",
        startedAt: "2026-06-01T10:00:00Z",
        completedAt: "2026-06-01T11:00:00Z",
      },
      [
        exercise("walk", "2026-06-01T10:05:00Z", "2026-06-01T10:55:00Z", "WALKING"),
        exercise(
          "lift",
          "2026-06-01T10:05:00Z",
          "2026-06-01T10:55:00Z",
          "WEIGHT_TRAINING"
        ),
      ]
    );

    assert.ok(match);
    assert.equal(match.exercise.externalId, "lift");
  });
});
