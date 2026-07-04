import { describe, expect, it } from "vitest";
import { getCommunitySeasonCountdown } from "./community-season-countdown";

describe("getCommunitySeasonCountdown", () => {
  it("returns 0 days left on the last day of the month", () => {
    const lastDay = new Date("2026-07-31T12:00:00");
    expect(getCommunitySeasonCountdown(lastDay).daysLeft).toBe(0);
  });

  it("returns days until month end", () => {
    const midMonth = new Date("2026-07-04T12:00:00");
    expect(getCommunitySeasonCountdown(midMonth).daysLeft).toBe(27);
  });

  it("progress increases through the month", () => {
    const start = getCommunitySeasonCountdown(new Date("2026-07-01T12:00:00"));
    const mid = getCommunitySeasonCountdown(new Date("2026-07-16T12:00:00"));
    expect(mid.progressPct).toBeGreaterThan(start.progressPct);
  });
});
