import { describe, expect, it } from "vitest";
import {
  computeChallengeMetrics,
  getWeeklyChallengeDefinition,
} from "./community-challenges";

describe("getWeeklyChallengeDefinition", () => {
  it("rotates challenge types by week", () => {
    const a = getWeeklyChallengeDefinition("2026-06-02");
    const b = getWeeklyChallengeDefinition("2026-06-09");
    expect(a.key).not.toBe(b.key);
  });
});

describe("computeChallengeMetrics", () => {
  it("marks plan completion at 80%", () => {
    const definition = getWeeklyChallengeDefinition("2026-06-02");
    const result = computeChallengeMetrics({
      definition: { ...definition, key: "plan_completion", targetValue: 80, unit: "percent" },
      sessions: [],
      plan: { week: [{}, {}, {}, {}] } as never,
      proteinHitDays: 0,
    });

    expect(result.completed).toBe(false);
    expect(result.progressValue).toBe(0);
  });
});
