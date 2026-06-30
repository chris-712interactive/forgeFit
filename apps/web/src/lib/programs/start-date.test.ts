import assert from "node:assert/strict";
import test from "node:test";
import {
  isValidPlanStartDate,
  resolveProgramStartDate,
  todayScheduleStartIso,
} from "./start-date.ts";

test("resolveProgramStartDate defaults to now when omitted", () => {
  const result = resolveProgramStartDate();
  assert.ok("startDate" in result);
});

test("resolveProgramStartDate rejects invalid dates", () => {
  const result = resolveProgramStartDate("2020-01-01");
  assert.equal("error" in result, true);
});

test("resolveProgramStartDate accepts today", () => {
  const result = resolveProgramStartDate(todayScheduleStartIso());
  assert.ok("startDate" in result);
  assert.equal(isValidPlanStartDate(todayScheduleStartIso()), true);
});
