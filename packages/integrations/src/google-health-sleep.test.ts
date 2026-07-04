import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { summarizeSleepSessions } from "./google-health";

describe("summarizeSleepSessions", () => {
  it("captures wake clock fields from civil end time and endTime", () => {
    const summaries = summarizeSleepSessions([
      {
        interval: {
          civilEndTime: {
            date: { year: 2026, month: 7, day: 4 },
            time: { hours: 6, minutes: 45, seconds: 0, nanos: 0 },
          },
          endTime: "2026-07-04T10:45:00.000Z",
        },
        summary: {
          minutesAsleep: 370,
          minutesInSleepPeriod: 410,
        },
      },
    ]);

    assert.equal(summaries.length, 1);
    assert.equal(summaries[0]?.date, "2026-07-04");
    assert.equal(summaries[0]?.durationMinutes, 370);
    assert.equal(summaries[0]?.wakeLocalMinutes, 6 * 60 + 45);
    assert.equal(summaries[0]?.wakeAtUtc, "2026-07-04T10:45:00.000Z");
  });

  it("skips naps", () => {
    const summaries = summarizeSleepSessions([
      {
        metadata: { nap: true },
        interval: {
          civilEndTime: {
            date: { year: 2026, month: 7, day: 4 },
            time: { hours: 14, minutes: 0, seconds: 0, nanos: 0 },
          },
        },
        summary: { minutesAsleep: 30 },
      },
    ]);

    assert.equal(summaries.length, 0);
  });
});
