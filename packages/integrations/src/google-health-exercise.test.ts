import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  exerciseListFilter,
  parseExerciseDataPoint,
} from "./google-health";

describe("parseExerciseDataPoint", () => {
  it("parses metrics summary and zone durations", () => {
    const parsed = parseExerciseDataPoint({
      name: "users/me/dataTypes/exercise/dataPoints/abc123",
      exercise: {
        interval: {
          startTime: "2026-02-23T06:00:00Z",
          endTime: "2026-02-23T06:15:00Z",
        },
        exerciseType: "WALKING",
        displayName: "Walk",
        activeDuration: "900s",
        metricsSummary: {
          caloriesKcal: 17,
          averageHeartRateBeatsPerMinute: "81",
          activeZoneMinutes: "0",
          heartRateZoneDurations: {
            lightTime: "900s",
          },
        },
      },
    });

    assert.ok(parsed);
    assert.equal(parsed.externalId, "abc123");
    assert.equal(parsed.avgHeartRateBpm, 81);
    assert.equal(parsed.activeZoneMinutes, 0);
    assert.equal(parsed.caloriesKcal, 17);
    assert.equal(parsed.durationSeconds, 900);
    assert.equal(parsed.zoneDurations.lightSeconds, 900);
    assert.equal(parsed.zoneDurations.peakSeconds, null);
  });

  it("returns null when interval is missing", () => {
    assert.equal(parseExerciseDataPoint({ exercise: {} }), null);
  });

  it("derives duration from interval when activeDuration missing", () => {
    const parsed = parseExerciseDataPoint({
      exercise: {
        interval: {
          startTime: "2026-06-01T10:00:00Z",
          endTime: "2026-06-01T11:00:00Z",
        },
        exerciseType: "WEIGHT_TRAINING",
      },
    });

    assert.ok(parsed);
    assert.equal(parsed.durationSeconds, 3600);
  });
});

describe("exerciseListFilter", () => {
  it("uses RFC3339 end_time bounds", () => {
    const filter = exerciseListFilter("2026-06-01", "2026-06-07");
    assert.match(filter, /exercise\.interval\.end_time >= "2026-06-01T00:00:00Z"/);
    assert.match(filter, /exercise\.interval\.end_time < "2026-06-08T00:00:00Z"/);
  });
});
