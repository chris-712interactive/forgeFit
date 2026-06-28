import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildWeighInReminder,
  daysSinceIsoDate,
  isWeighInReminderGoal,
} from "./weigh-in-reminder";

test("isWeighInReminderGoal matches fat loss and recomposition only", () => {
  assert.equal(isWeighInReminderGoal("fat_loss"), true);
  assert.equal(isWeighInReminderGoal("recomposition"), true);
  assert.equal(isWeighInReminderGoal("bodybuilding"), false);
});

test("buildWeighInReminder hides banner before 7 days", () => {
  const reminder = buildWeighInReminder({
    goal: "fat_loss",
    lastWeighInDate: "2026-06-24",
    todayIso: "2026-06-28",
  });
  assert.ok(reminder);
  assert.equal(reminder.showBanner, false);
  assert.equal(reminder.daysSinceLastWeighIn, 4);
});

test("buildWeighInReminder shows banner at 7+ days", () => {
  const reminder = buildWeighInReminder({
    goal: "fat_loss",
    lastWeighInDate: "2026-06-20",
    todayIso: "2026-06-28",
  });
  assert.ok(reminder);
  assert.equal(reminder.showBanner, true);
  assert.equal(daysSinceIsoDate("2026-06-20", "2026-06-28"), 8);
});
