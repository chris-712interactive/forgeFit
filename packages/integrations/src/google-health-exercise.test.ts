import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  exerciseListFilter,
  parseExerciseDataPoint,
} from "./google-health";

describe("parseExerciseDataPoint", () => {
  it("parses Google Health moderateTime and vigorousTime zone fields", () => {
    const parsed = parseExerciseDataPoint({
      exercise: {
        interval: {
          startTime: "2026-06-01T10:00:00Z",
          endTime: "2026-06-01T11:00:00Z",
        },
        exerciseType: "WEIGHT_TRAINING",
        metricsSummary: {
          averageHeartRateBeatsPerMinute: "128",
          activeZoneMinutes: "12",
          heartRateZoneDurations: {
            lightTime: "600s",
            moderateTime: "900s",
            vigorousTime: "300s",
            peakTime: "120s",
          },
        },
      },
    });

    assert.ok(parsed);
    assert.equal(parsed.zoneDurations.lightSeconds, 600);
    assert.equal(parsed.zoneDurations.fatBurnSeconds, 900);
    assert.equal(parsed.zoneDurations.cardioSeconds, 300);
    assert.equal(parsed.zoneDurations.peakSeconds, 120);
  });

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
  it("uses civil_start_time bounds per Google Health session filter", () => {
    const filter = exerciseListFilter("2026-06-01", "2026-06-07");
    assert.match(
      filter,
      /exercise\.interval\.civil_start_time >= "2026-06-01"/
    );
    assert.match(
      filter,
      /exercise\.interval\.civil_start_time < "2026-06-08"/
    );
  });
});
