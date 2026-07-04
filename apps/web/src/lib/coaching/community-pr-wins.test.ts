import { describe, expect, it } from "vitest";
import {
  dedupeCommunityPrWins,
  parsePrWinMovement,
  prWinE1rmKg,
} from "./community-pr-wins";
import type { CommunityWinRow } from "./types";

function prWin(
  overrides: Partial<CommunityWinRow> & Pick<CommunityWinRow, "id">
): CommunityWinRow {
  return {
    userId: "user-1",
    displayLabel: "Alex",
    winType: "pr",
    headline: "New PR — Bench Press",
    detail: "5 reps at 100 kg. Strong.",
    occurredAt: "2026-07-04T14:00:00.000Z",
    cheerCount: 0,
    cheeredByMe: false,
    isCurrentUser: false,
    ...overrides,
  };
}

describe("parsePrWinMovement", () => {
  it("extracts movement from PR headline", () => {
    expect(parsePrWinMovement("New PR — Back Squat")).toBe("Back Squat");
  });
});

describe("dedupeCommunityPrWins", () => {
  it("keeps only the highest PR for same user, movement, and day", () => {
    const wins = [
      prWin({
        id: "a",
        detail: "3 reps at 100 kg. Strong.",
        occurredAt: "2026-07-04T16:00:00.000Z",
      }),
      prWin({
        id: "b",
        detail: "5 reps at 110 kg. Strong.",
        occurredAt: "2026-07-04T18:00:00.000Z",
      }),
      prWin({
        id: "c",
        detail: "1 reps at 120 kg. Strong.",
        occurredAt: "2026-07-04T20:00:00.000Z",
      }),
    ];

    const result = dedupeCommunityPrWins(wins);
    expect(result.map((win) => win.id)).toEqual(["c"]);
  });

  it("keeps PRs on different days for the same movement", () => {
    const wins = [
      prWin({
        id: "monday",
        occurredAt: "2026-07-01T12:00:00.000Z",
      }),
      prWin({
        id: "friday",
        occurredAt: "2026-07-04T12:00:00.000Z",
      }),
    ];

    const result = dedupeCommunityPrWins(wins);
    expect(result.map((win) => win.id)).toEqual(["monday", "friday"]);
  });

  it("keeps PRs for different movements on the same day", () => {
    const wins = [
      prWin({ id: "bench", headline: "New PR — Bench Press" }),
      prWin({ id: "squat", headline: "New PR — Back Squat" }),
    ];

    const result = dedupeCommunityPrWins(wins);
    expect(result.map((win) => win.id)).toEqual(["bench", "squat"]);
  });

  it("does not dedupe non-PR wins", () => {
    const wins = [
      prWin({ id: "pr-1" }),
      {
        ...prWin({ id: "streak-1" }),
        winType: "streak" as const,
        headline: "4-week streak",
        detail: "Training streak milestone",
      },
    ];

    const result = dedupeCommunityPrWins(wins);
    expect(result).toHaveLength(2);
  });

  it("compares imperial detail copy", () => {
    const wins = [
      prWin({
        id: "lower",
        detail: "5 reps at 200 lb. Strong.",
        occurredAt: "2026-07-04T10:00:00.000Z",
      }),
      prWin({
        id: "higher",
        detail: "3 reps at 275 lb. Strong.",
        occurredAt: "2026-07-04T12:00:00.000Z",
      }),
    ];

    expect(prWinE1rmKg(wins[1]!.detail)! > prWinE1rmKg(wins[0]!.detail)!).toBe(
      true
    );
    expect(dedupeCommunityPrWins(wins).map((win) => win.id)).toEqual(["higher"]);
  });
});
