import assert from "node:assert/strict";
import test from "node:test";
import { projectWaist } from "./waist-projection";

const history = [
  { date: "2026-06-01", waistCm: 90 },
  { date: "2026-06-08", waistCm: 89 },
  { date: "2026-06-15", waistCm: 88.5 },
];

test("projectWaist returns null with fewer than two entries", () => {
  assert.equal(
    projectWaist({
      history: [{ date: "2026-06-01", waistCm: 90 }],
      horizonDays: 30,
    }),
    null
  );
});

test("projectWaist projects downward trend from waist logs", () => {
  const projection = projectWaist({
    history,
    horizonDays: 30,
    goal: "fat_loss",
  });

  assert.ok(projection);
  assert.ok(projection.weeklyChangeCm < 0);

  const lastProjected = projection.points.filter((point) => point.projected).at(-1);
  assert.ok(lastProjected);
  assert.ok(lastProjected.waistCm < 88.5);
});

test("projectWaist clamps extreme weekly change", () => {
  const projection = projectWaist({
    history: [
      { date: "2026-06-01", waistCm: 100 },
      { date: "2026-06-08", waistCm: 90 },
    ],
    horizonDays: 14,
  });

  assert.ok(projection);
  assert.ok(Math.abs(projection.weeklyChangeCm) <= 1.5);
});
