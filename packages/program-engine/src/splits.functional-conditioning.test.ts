import assert from "node:assert/strict";
import test from "node:test";
import { getWeeklySplit } from "./splits";

test("functional_conditioning split includes conditioning session", () => {
  const split = getWeeklySplit("functional_conditioning", 3);
  assert.equal(split.length, 3);
  assert.ok(split.some((session) => session.sessionType === "conditioning"));
  assert.ok(split.some((session) => session.sessionType !== "conditioning"));
});

test("functional_conditioning adds second conditioning day at 6 sessions", () => {
  const split = getWeeklySplit("functional_conditioning", 6);
  const conditioningDays = split.filter(
    (session) => session.sessionType === "conditioning"
  );
  assert.equal(conditioningDays.length, 2);
});
