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
