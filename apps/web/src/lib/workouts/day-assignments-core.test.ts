import assert from "node:assert/strict";
import test from "node:test";
import { CUSTOM_DAY_INDEX } from "./session-source";
import { completedCustomSessionForAssignment } from "./day-assignments-core";
import type { WorkoutSessionRecord } from "./sessions";

function customSession(
  overrides: Partial<WorkoutSessionRecord> & Pick<WorkoutSessionRecord, "clientId">
): WorkoutSessionRecord {
  return {
    id: overrides.clientId,
    dayIndex: CUSTOM_DAY_INDEX,
    sessionSource: "custom",
    sessionName: "Custom Day",
    status: "completed",
    startedAt: "2026-07-15T14:00:00.000Z",
    completedAt: "2026-07-15T15:00:00.000Z",
    sets: [{ exerciseId: "a", exerciseName: "A", setNumber: 1, completed: true }],
    templateId: "template-1",
    ...overrides,
  };
}

test("completedCustomSessionForAssignment matches template and scheduled date", () => {
  const match = customSession({
    clientId: "done-today",
    templateId: "template-1",
    completedAt: "2026-07-15T18:00:00.000Z",
  });
  const otherDay = customSession({
    clientId: "done-yesterday",
    templateId: "template-1",
    completedAt: "2026-07-14T18:00:00.000Z",
  });

  const result = completedCustomSessionForAssignment(
    { templateId: "template-1", scheduledDateIso: "2026-07-15" },
    [otherDay, match],
    "UTC"
  );

  assert.equal(result?.clientId, "done-today");
});

test("completedCustomSessionForAssignment ignores in-progress sessions", () => {
  const inProgress = customSession({
    clientId: "active",
    status: "in_progress",
    completedAt: null,
  });

  const result = completedCustomSessionForAssignment(
    { templateId: "template-1", scheduledDateIso: "2026-07-15" },
    [inProgress],
    "UTC"
  );

  assert.equal(result, null);
});
