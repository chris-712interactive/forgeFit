import assert from "node:assert/strict";
import test from "node:test";
import type { ProgramPlan } from "@forgefit/program-engine";
import { canStartPlanSessionWithOverrides } from "@/lib/workouts/schedule-overrides";
import {
  applyScheduleAdjustment,
  effectiveScheduledDateIso,
  formatEffectiveSessionDate,
  isScheduleAdjusted,
  resetScheduleAdjustment,
  resetWeekScheduleAdjustments,
} from "./schedule-overrides";

const plan = {
  scheduleStartDate: "2026-07-07",
  generatedAt: "2026-07-07T12:00:00.000Z",
  week: [
    { dayIndex: 0, name: "Lower A", dayLabel: "Mon" },
    { dayIndex: 2, name: "Upper A", dayLabel: "Wed" },
    { dayIndex: 4, name: "Lower B", dayLabel: "Fri" },
  ],
} as ProgramPlan;

const wednesday = new Date(2026, 6, 9, 12, 0, 0, 0);

test("applyScheduleAdjustment moves a workout within the plan week", () => {
  const result = applyScheduleAdjustment(0, "2026-07-10", plan, [], wednesday);

  assert.equal(
    effectiveScheduledDateIso(0, plan, result.overrides, wednesday),
    "2026-07-10"
  );
  assert.equal(isScheduleAdjusted(0, plan, result.overrides, wednesday), true);
});

test("applyScheduleAdjustment swaps when the target day is occupied", () => {
  const moved = applyScheduleAdjustment(0, "2026-07-10", plan, [], wednesday);
  const swapped = applyScheduleAdjustment(
    2,
    "2026-07-07",
    plan,
    moved.overrides,
    wednesday
  );

  assert.equal(
    effectiveScheduledDateIso(0, plan, swapped.overrides, wednesday),
    "2026-07-10"
  );
  assert.equal(
    effectiveScheduledDateIso(2, plan, swapped.overrides, wednesday),
    "2026-07-07"
  );
  assert.equal(swapped.swappedWithDayIndex, 0);
});

test("resetScheduleAdjustment restores the default weekday", () => {
  const moved = applyScheduleAdjustment(0, "2026-07-10", plan, [], wednesday);
  const reset = resetScheduleAdjustment(0, plan, moved.overrides, wednesday);

  assert.equal(isScheduleAdjusted(0, plan, reset, wednesday), false);
  assert.equal(
    effectiveScheduledDateIso(0, plan, reset, wednesday),
    "2026-07-07"
  );
});

test("resetWeekScheduleAdjustments clears the active week only", () => {
  const moved = applyScheduleAdjustment(0, "2026-07-10", plan, [], wednesday);
  const otherWeek = [
    ...moved.overrides,
    { weekStartIso: "2026-06-30", dayIndex: 1, adjustedDateIso: "2026-07-02" },
  ];
  const reset = resetWeekScheduleAdjustments(plan, otherWeek, wednesday);

  assert.deepEqual(reset, [
    { weekStartIso: "2026-06-30", dayIndex: 1, adjustedDateIso: "2026-07-02" },
  ]);
});

test("canStartPlanSession respects adjusted dates for early and delayed starts", () => {
  const moved = applyScheduleAdjustment(4, "2026-07-09", plan, [], wednesday);

  assert.equal(canStartPlanSessionWithOverrides(4, plan, moved.overrides, wednesday), false);
  assert.equal(
    canStartPlanSessionWithOverrides(
      4,
      plan,
      moved.overrides,
      new Date(2026, 6, 10, 12, 0, 0, 0)
    ),
    true
  );
  assert.equal(
    canStartPlanSessionWithOverrides(0, plan, moved.overrides, wednesday),
    true
  );
});

test("formatEffectiveSessionDate notes when a workout moved", () => {
  const moved = applyScheduleAdjustment(0, "2026-07-10", plan, [], wednesday);
  const label = formatEffectiveSessionDate(
    0,
    plan,
    moved.overrides,
    wednesday
  );

  assert.match(label, /moved from Mon/i);
});
