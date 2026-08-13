import test from "node:test";
import assert from "node:assert/strict";
import {
  CUSTOM_DAY_INDEX,
  isCustomWorkoutSession,
  listInProgressCustomSessions,
  listUnassignedInProgressCustomSessions,
} from "./session-source";

test("isCustomWorkoutSession detects custom and imported sessions", () => {
  assert.equal(
    isCustomWorkoutSession({ dayIndex: 1, sessionSource: "program" }),
    false
  );
  assert.equal(
    isCustomWorkoutSession({ dayIndex: CUSTOM_DAY_INDEX, sessionSource: "custom" }),
    true
  );
  assert.equal(
    isCustomWorkoutSession({ dayIndex: CUSTOM_DAY_INDEX, sessionSource: "imported" }),
    true
  );
  assert.equal(
    isCustomWorkoutSession({ dayIndex: CUSTOM_DAY_INDEX }),
    true
  );
});

test("listInProgressCustomSessions returns newest custom sessions only", () => {
  const listed = listInProgressCustomSessions([
    {
      clientId: "program",
      dayIndex: 1,
      sessionSource: "program" as const,
      status: "in_progress",
      startedAt: "2026-08-13T12:00:00.000Z",
    },
    {
      clientId: "older-custom",
      dayIndex: CUSTOM_DAY_INDEX,
      sessionSource: "custom" as const,
      status: "in_progress",
      startedAt: "2026-08-13T10:00:00.000Z",
    },
    {
      clientId: "done-custom",
      dayIndex: CUSTOM_DAY_INDEX,
      sessionSource: "custom" as const,
      status: "completed",
      startedAt: "2026-08-13T11:00:00.000Z",
    },
    {
      clientId: "newer-custom",
      dayIndex: CUSTOM_DAY_INDEX,
      sessionSource: "custom" as const,
      status: "in_progress",
      startedAt: "2026-08-13T13:00:00.000Z",
    },
  ]);

  assert.deepEqual(
    listed.map((session) => session.clientId),
    ["newer-custom", "older-custom"]
  );
});

test("listUnassignedInProgressCustomSessions skips assignment Continue cards", () => {
  const listed = listUnassignedInProgressCustomSessions(
    [
      {
        clientId: "assigned",
        dayIndex: CUSTOM_DAY_INDEX,
        sessionSource: "custom" as const,
        status: "in_progress",
        startedAt: "2026-08-13T13:00:00.000Z",
      },
      {
        clientId: "builder",
        dayIndex: CUSTOM_DAY_INDEX,
        sessionSource: "custom" as const,
        status: "in_progress",
        startedAt: "2026-08-13T12:00:00.000Z",
      },
    ],
    ["assigned"]
  );

  assert.deepEqual(
    listed.map((session) => session.clientId),
    ["builder"]
  );
});
