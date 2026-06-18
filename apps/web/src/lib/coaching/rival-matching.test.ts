import { describe, expect, it } from "vitest";
import { buildRivalRow, pickWeeklyRivalUserId } from "./rival-matching";
import type { LeaderboardEntryRow } from "./types";

const board: LeaderboardEntryRow[] = [
  { userId: "a", displayLabel: "Alex", habitScore: 90, isCurrentUser: false },
  { userId: "b", displayLabel: "Blake", habitScore: 82, isCurrentUser: false },
  { userId: "me", displayLabel: "Me", habitScore: 78, isCurrentUser: true },
  { userId: "d", displayLabel: "Dana", habitScore: 70, isCurrentUser: false },
];

describe("pickWeeklyRivalUserId", () => {
  it("prefers the closest competitor by rank and score", () => {
    expect(pickWeeklyRivalUserId("me", board)).toBe("b");
  });

  it("returns null when user is not on the board", () => {
    expect(pickWeeklyRivalUserId("missing", board)).toBeNull();
  });
});

describe("buildRivalRow", () => {
  it("marks rival ahead and computes gap", () => {
    const rival = buildRivalRow("me", "b", board);
    expect(rival).toMatchObject({
      displayLabel: "Blake",
      rank: 2,
      pointsGap: 4,
      isAhead: true,
    });
  });
});
