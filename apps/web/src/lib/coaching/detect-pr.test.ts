import assert from "node:assert/strict";
import test from "node:test";
import {
  detectSetPr,
  isActualOneRepMaxPr,
} from "./detect-pr.ts";

test("detectSetPr records a true single as the actual weight, not an inflated e1RM", () => {
  const pr = detectSetPr("barbell_squat", "Barbell Squat", 140, 1, 0, 120);
  assert.ok(pr);
  assert.equal(pr!.weightKg, 140);
  assert.equal(pr!.e1rmKg, 140);
  assert.equal(isActualOneRepMaxPr(pr!), true);
});

test("detectSetPr still estimates multi-rep PRs", () => {
  const pr = detectSetPr("barbell_squat", "Barbell Squat", 120, 5, 0, 100);
  assert.ok(pr);
  assert.equal(pr!.e1rmKg, Math.round(120 * (1 + 5 / 30) * 10) / 10);
  assert.equal(isActualOneRepMaxPr(pr!), false);
});
