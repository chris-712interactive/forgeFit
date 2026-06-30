import assert from "node:assert/strict";
import test from "node:test";
import { blockedWeekdaysForProfile } from "./practice-schedule";
import type { ProgramUserProfile } from "./types";

const baseSportProfile: ProgramUserProfile = {
  goal: "sport_performance",
  experience: "intermediate",
  sessionsPerWeek: 3,
  minutesPerSession: 45,
  weightKg: 70,
  heightCm: 175,
  age: 16,
  sex: "male",
  equipment: ["barbell"],
  recoveryEquipment: [],
  sportId: "football",
  sportSeasonPhase: "in_season",
  sportPracticeDays: [1, 3],
  sportPracticeGymPolicy: "avoid",
};

test("blockedWeekdaysForProfile returns practice days when policy is avoid", () => {
  assert.deepEqual(blockedWeekdaysForProfile(baseSportProfile), [1, 3]);
});

test("blockedWeekdaysForProfile ignores practice days when schedule varies", () => {
  assert.deepEqual(
    blockedWeekdaysForProfile({
      ...baseSportProfile,
      sportPracticeScheduleVaries: true,
    }),
    []
  );
});

test("blockedWeekdaysForProfile does not block when policy allows gym", () => {
  assert.deepEqual(
    blockedWeekdaysForProfile({
      ...baseSportProfile,
      sportPracticeGymPolicy: "allow",
    }),
    []
  );
});

test("blockedWeekdaysForProfile defaults in-season to avoid", () => {
  assert.deepEqual(
    blockedWeekdaysForProfile({
      ...baseSportProfile,
      sportPracticeGymPolicy: undefined,
      sportSeasonPhase: "in_season",
    }),
    [1, 3]
  );
});
