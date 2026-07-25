import assert from "node:assert/strict";
import test from "node:test";
import { parseScheduleStartIso, toScheduleStartIso } from "@forgefit/program-engine";
import {
  earliestAllowedPlanStartIso,
  isValidPlanStartDate,
  todayScheduleStartIso,
} from "./start-date.ts";
import { resolveProgramStartDate } from "./start-date-server.ts";

test("resolveProgramStartDate defaults to now when omitted", async () => {
  const result = await resolveProgramStartDate();
  assert.ok("startDate" in result);
});

test("resolveProgramStartDate rejects invalid dates", async () => {
  const result = await resolveProgramStartDate("2020-01-01");
  assert.equal("error" in result, true);
});

test("resolveProgramStartDate accepts today", async () => {
  const result = await resolveProgramStartDate(todayScheduleStartIso());
  assert.ok("startDate" in result);
  assert.equal(isValidPlanStartDate(todayScheduleStartIso()), true);
});

test("isValidPlanStartDate allows yesterday for timezone skew", () => {
  const yesterday = parseScheduleStartIso(todayScheduleStartIso());
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayIso = toScheduleStartIso(yesterday);
  assert.equal(isValidPlanStartDate(yesterdayIso), true);
  assert.equal(yesterdayIso, earliestAllowedPlanStartIso());
});

test("isValidPlanStartDate rejects dates before yesterday", () => {
  const tooEarly = parseScheduleStartIso(todayScheduleStartIso());
  tooEarly.setDate(tooEarly.getDate() - 2);
  assert.equal(isValidPlanStartDate(toScheduleStartIso(tooEarly)), false);
});
