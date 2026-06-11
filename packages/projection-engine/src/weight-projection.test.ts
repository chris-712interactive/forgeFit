import assert from "node:assert/strict";
import test from "node:test";
import { projectWeight } from "./weight-projection";

const history = [
  { date: "2026-06-01", weightKg: 80 },
  { date: "2026-06-08", weightKg: 79.5 },
];

test("projectWeight uses effective deficit prior for fat loss", () => {
  const projection = projectWeight({
    history,
    goal: "fat_loss",
    age: 30,
    effectiveDeficitKcal: 600,
    trainingKcalPerDay: 250,
    horizonDays: 30,
  });

  assert.equal(projection.ruleId, "energy_balance_projection");
  assert.equal(projection.effectiveDeficitKcal, 600);
  assert.equal(projection.trainingKcalPerDay, 250);
  assert.ok(projection.weeklyChangeKg < 0);

  const expectedWeeklyKg = -((600 * 7) / 7700);
  assert.ok(Math.abs(projection.weeklyChangeKg - expectedWeeklyKg) < 0.15);
});

test("projectWeight caps aggressive deficit-based loss within evidence bounds", () => {
  const projection = projectWeight({
    history: [{ date: "2026-06-08", weightKg: 80 }],
    goal: "fat_loss",
    age: 30,
    effectiveDeficitKcal: 2000,
    horizonDays: 30,
  });

  const maxWeeklyLossKg = 80 * 0.01;
  assert.ok(Math.abs(projection.weeklyChangeKg) <= maxWeeklyLossKg + 0.01);
});

test("projectWeight falls back to goal rate without training-aware nutrition", () => {
  const projection = projectWeight({
    history,
    goal: "fat_loss",
    age: 30,
    horizonDays: 30,
  });

  assert.equal(projection.ruleId, "fat_loss_rate");
  assert.equal(projection.effectiveDeficitKcal, undefined);
});
