import { describe, expect, it } from "vitest";
import { getCommunityWeekCountdown } from "./community-week-countdown";

describe("getCommunityWeekCountdown", () => {
  it("returns 0 days left on Sunday", () => {
    const sunday = new Date("2026-07-05T12:00:00");
    expect(getCommunityWeekCountdown(sunday).daysLeft).toBe(0);
  });

  it("returns 6 days left on Monday", () => {
    const monday = new Date("2026-06-29T12:00:00");
    expect(getCommunityWeekCountdown(monday).daysLeft).toBe(6);
  });

  it("progress increases through the week", () => {
    const monday = getCommunityWeekCountdown(new Date("2026-06-29T12:00:00"));
    const friday = getCommunityWeekCountdown(new Date("2026-07-03T12:00:00"));
    expect(friday.progressPct).toBeGreaterThan(monday.progressPct);
  });
});
