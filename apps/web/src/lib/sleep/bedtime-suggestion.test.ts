import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildBedtimeSuggestion,
  formatClockMinutes,
} from "./bedtime-suggestion";
import type { DailySleepLog } from "./types";
import { SLEEP_TARGET_MIN_MINUTES } from "./types";

function log(
  sleepDate: string,
  durationMinutes: number,
  wakeLocalMinutes: number
): DailySleepLog {
  return {
    sleepDate,
    durationMinutes,
    minutesInBed: durationMinutes + 20,
    deepMinutes: 90,
    remMinutes: 80,
    awakeMinutes: 10,
    wakeAt: null,
    wakeLocalMinutes,
    source: "fitbit",
  };
}

test("buildBedtimeSuggestion returns null when sleep is on target", () => {
  const result = buildBedtimeSuggestion(
    [
      log("2026-07-01", 450, 7 * 60),
      log("2026-07-02", 460, 7 * 60 + 5),
      log("2026-07-03", 455, 7 * 60 + 2),
    ],
    "2026-07-03"
  );

  assert.equal(result, null);
});

test("buildBedtimeSuggestion suggests bedtime from average wake time", () => {
  const result = buildBedtimeSuggestion(
    [
      log("2026-06-28", 370, 6 * 60 + 45),
      log("2026-06-29", 360, 6 * 60 + 50),
      log("2026-06-30", 375, 6 * 60 + 40),
      log("2026-07-01", 365, 6 * 60 + 48),
      log("2026-07-02", 372, 6 * 60 + 42),
      log("2026-07-03", 368, 6 * 60 + 46),
    ],
    "2026-07-03"
  );

  assert.ok(result?.show);
  assert.match(result?.summary ?? "", /wake around 6:4[0-9] AM/i);
  assert.match(result?.summary ?? "", /11:4[0-9] PM/i);
  assert.equal(result?.targetMinutes, SLEEP_TARGET_MIN_MINUTES);
});

test("formatClockMinutes renders 12-hour clock labels", () => {
  assert.equal(formatClockMinutes(6 * 60 + 45), "6:45 AM");
  assert.equal(formatClockMinutes(22 * 60 + 15), "10:15 PM");
});
