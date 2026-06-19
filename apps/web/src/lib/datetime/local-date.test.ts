import { describe, expect, it } from "vitest";
import {
  addDaysIso,
  formatIsoDate,
  todayLocalIsoDate,
  yesterdayLocalIsoDate,
} from "./local-date";

describe("formatIsoDate", () => {
  it("uses the user's timezone, not UTC, for calendar day", () => {
    // 8:10 PM Eastern on Jun 18, 2026 (EDT, UTC-4) is already Jun 19 in UTC.
    const eveningEastern = new Date("2026-06-19T00:10:00.000Z");

    expect(formatIsoDate(eveningEastern, "America/New_York")).toBe("2026-06-18");
    expect(formatIsoDate(eveningEastern, "UTC")).toBe("2026-06-19");
  });
});

describe("todayLocalIsoDate", () => {
  it("returns yesterday relative to a reference date in timezone", () => {
    const reference = new Date("2026-06-19T00:10:00.000Z");
    expect(todayLocalIsoDate(reference, "America/New_York")).toBe("2026-06-18");
    expect(yesterdayLocalIsoDate(reference, "America/New_York")).toBe(
      "2026-06-17"
    );
  });
});

describe("addDaysIso", () => {
  it("shifts calendar dates without DST edge cases", () => {
    expect(addDaysIso("2026-06-18", 1)).toBe("2026-06-19");
    expect(addDaysIso("2026-06-18", -1)).toBe("2026-06-17");
  });
});
