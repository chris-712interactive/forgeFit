import assert from "node:assert/strict";
import test from "node:test";
import type { ProgramPlan } from "@forgefit/program-engine";
import { findNextPlannedSession } from "./next-session";
import type { WorkoutSessionRecord } from "./sessions";

const plan = {
  scheduleStartDate: "2026-07-02",
  generatedAt: "2026-07-02T12:00:00.000Z",
  week: [
    { dayIndex: 2, name: "Upper" },
    { dayIndex: 3, name: "Lower" },
    { dayIndex: 4, name: "Upper" },
  ],
} as ProgramPlan;

function session(
  partial: Pick<
    WorkoutSessionRecord,
    "dayIndex" | "status" | "startedAt" | "completedAt" | "clientId" | "sessionName"
  >
): WorkoutSessionRecord {
  return {
    id: partial.clientId,
    sets: [],
    ...partial,
  };
}

test("findNextPlannedSession skips same session kind as yesterday when plan repeats it", () => {
  const referenceDate = new Date(2026, 6, 2, 12, 0, 0, 0);
  const records = [
    session({
      clientId: "yesterday-upper",
      dayIndex: 1,
      sessionName: "Upper",
      status: "completed",
      startedAt: "2026-07-01T10:00:00.000Z",
      completedAt: "2026-07-01T11:00:00.000Z",
    }),
  ];

  const next = findNextPlannedSession(records, plan, referenceDate);

  assert.deepEqual(next, { dayIndex: 3, name: "Lower" });
});
