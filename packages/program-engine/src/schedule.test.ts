import assert from "node:assert/strict";
import test from "node:test";
import { assignSessionWeekdays } from "./schedule";

test("assignSessionWeekdays wraps to earlier weekdays by default", () => {
  const days = assignSessionWeekdays(4, 4);
  assert.ok(days.includes(0) || days.includes(1) || days.includes(2) || days.includes(3));
});

test("scheduleFromTodayOnly avoids past weekdays when enough days remain", () => {
  const days = assignSessionWeekdays(4, 2, { scheduleFromTodayOnly: true });
  for (const day of days) {
    assert.ok(day >= 2, `expected weekday >= Wed (2), got ${day}`);
  }
});

test("scheduleFromTodayOnly still fills session count late in the week", () => {
  const days = assignSessionWeekdays(4, 4, { scheduleFromTodayOnly: true });
  assert.equal(days.length, 4);
});

test("blockedWeekdays prefers open days when enough remain", () => {
  const days = assignSessionWeekdays(3, 0, {
    blockedWeekdays: [1, 3, 5],
  });
  for (const day of days) {
    assert.ok(!([1, 3, 5] as number[]).includes(day));
  }
});

test("blockedWeekdays falls back when not enough open days remain", () => {
  const days = assignSessionWeekdays(4, 0, {
    blockedWeekdays: [0, 1, 2, 3, 4, 5],
  });
  assert.equal(days.length, 4);
  assert.ok(days.some((day) => day <= 5));
});

test("blockedWeekdays moves single session off blocked anchor when possible", () => {
  const days = assignSessionWeekdays(1, 2, {
    blockedWeekdays: [2],
  });
  assert.deepEqual(days, [3]);
});
