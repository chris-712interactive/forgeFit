import assert from "node:assert/strict";
import test from "node:test";
import type { WaistProjectionResult, WeightProjectionResult } from "@forgefit/projection-engine";
import { alignWaistProjectionToWeightTimeline } from "./waist-projection-align";

const weight: WeightProjectionResult = {
  horizonDays: 90,
  weeklyChangeKg: -0.7,
  weeklyChangePct: -0.54,
  ruleId: "energy_balance_projection",
  points: [
    { date: "2026-06-20", weightKg: 120, projected: false },
    { date: "2026-06-25", weightKg: 119.5, projected: false },
    { date: "2026-06-26", weightKg: 119.3, projected: true },
    { date: "2026-09-17", weightKg: 118.3, projected: true },
  ],
};

const waist: WaistProjectionResult = {
  horizonDays: 90,
  weeklyChangeCm: -1.5,
  points: [
    { date: "2026-06-01", waistCm: 96, projected: false },
    { date: "2026-06-10", waistCm: 94, projected: false },
    { date: "2026-09-17", waistCm: 90, projected: true },
  ],
};

test("alignWaistProjectionToWeightTimeline spans from weight pivot through projection", () => {
  const aligned = alignWaistProjectionToWeightTimeline(waist, weight);

  assert.ok(aligned.points.length >= 3);
  assert.equal(aligned.points[0]?.date, "2026-06-25");
  assert.equal(aligned.points.at(-1)?.date, "2026-09-17");

  const projected = aligned.points.filter((point) => point.projected);
  assert.ok(projected.length >= 2);
});

test("alignWaistProjectionToWeightTimeline keeps logged waist on matching dates", () => {
  const aligned = alignWaistProjectionToWeightTimeline(waist, weight);
  const loggedOnPivot = aligned.points.find(
    (point) => point.date === "2026-06-25"
  );

  assert.ok(loggedOnPivot);
  assert.ok(loggedOnPivot.waistCm > 0);
});
