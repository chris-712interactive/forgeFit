import assert from "node:assert/strict";
import test from "node:test";
import { generateProgram } from "./generate";
import { parseScheduleStartIso, toScheduleStartIso } from "./schedule";
import type { ProgramUserProfile } from "./types";

const baseProfile: ProgramUserProfile = {
  goal: "general_strength",
  experience: "intermediate",
  sessionsPerWeek: 3,
  minutesPerSession: 45,
  equipment: ["dumbbells", "bench", "bodyweight_only"],
  recoveryEquipment: [],
  weightKg: 80,
  heightCm: 178,
  age: 30,
  sex: "male",
};

test("toScheduleStartIso formats local calendar dates", () => {
  assert.equal(
    toScheduleStartIso(new Date(2026, 6, 7, 9, 30, 0, 0)),
    "2026-07-07"
  );
});

test("generateProgram stores scheduleStartDate from options.startDate", () => {
  const startDate = parseScheduleStartIso("2026-07-14");
  const plan = generateProgram(baseProfile, { startDate });

  assert.equal(plan.scheduleStartDate, "2026-07-14");
  assert.equal(plan.scheduleAnchorWeekday, 1);
});

test("future start dates do not rely on scheduleFromTodayOnly wrapping", () => {
  const startDate = parseScheduleStartIso("2026-07-14");
  const plan = generateProgram(baseProfile, {
    startDate,
    scheduleFromTodayOnly: false,
  });

  assert.ok(plan.week.every((session) => session.dayIndex >= 1));
});
