import { describe, expect, it } from "vitest";
import type { ProgramPlan } from "@forgefit/program-engine";
import type { WorkoutSessionRecord } from "@/lib/workouts/sessions";
import { computeTrainingStreakWeeks } from "./streak";

function plan(sessionsPerWeek: number): ProgramPlan {
  return {
    week: Array.from({ length: sessionsPerWeek }, (_, index) => ({
      dayIndex: index,
      name: `Day ${index + 1}`,
      exercises: [],
    })),
    isDeloadWeek: false,
    nutrition: null,
  } as ProgramPlan;
}

function completedSession(
  dayIndex: number,
  completedAt: string
): WorkoutSessionRecord {
  return {
    clientId: `session-${dayIndex}-${completedAt}`,
    dayIndex,
    sessionName: `Day ${dayIndex + 1}`,
    status: "completed",
    startedAt: completedAt,
    completedAt,
    exercises: [],
    sets: [{ exerciseId: "squat", setNumber: 1, completed: true, reps: 5, weightKg: 100 }],
  } as WorkoutSessionRecord;
}

describe("computeTrainingStreakWeeks", () => {
  it("returns 0 when no plan exists", () => {
    expect(computeTrainingStreakWeeks([], null)).toBe(0);
  });

  it("counts consecutive completed weeks", () => {
    const reference = new Date("2026-06-11T12:00:00.000Z"); // Wednesday
    const sessions = [
      completedSession(0, "2026-06-09T18:00:00.000Z"),
      completedSession(1, "2026-06-10T18:00:00.000Z"),
      completedSession(0, "2026-06-02T18:00:00.000Z"),
      completedSession(1, "2026-05-26T18:00:00.000Z"),
    ];

    expect(
      computeTrainingStreakWeeks(sessions, plan(2), reference)
    ).toBe(2);
  });

  it("ignores an in-progress current week when prior weeks qualify", () => {
    const reference = new Date("2026-06-11T12:00:00.000Z");
    const sessions = [completedSession(0, "2026-06-02T18:00:00.000Z")];

    expect(
      computeTrainingStreakWeeks(sessions, plan(2), reference)
    ).toBe(0);
  });
});
