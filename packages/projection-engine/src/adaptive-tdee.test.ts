import assert from "node:assert/strict";
import { test } from "node:test";
import { inferAdaptiveTdee } from "./adaptive-tdee";

test("inferAdaptiveTdee estimates maintenance from intake and weight trend", () => {
  const today = "2026-06-28";
  const intake = Array.from({ length: 21 }, (_, index) => ({
    date: `2026-06-${String(index + 8).padStart(2, "0")}`,
    calories: 2200,
  }));

  const result = inferAdaptiveTdee(
    intake,
    [
      { date: "2026-06-08", weightKg: 80 },
      { date: "2026-06-28", weightKg: 79.5 },
    ],
    today
  );

  assert.ok(result);
  assert.ok(result.estimatedTdeeKcal > 2350);
  assert.ok(result.estimatedTdeeKcal < 2450);
  assert.equal(result.confidence, "low");
});

test("inferAdaptiveTdee returns null with insufficient logs", () => {
  const result = inferAdaptiveTdee(
    [{ date: "2026-06-27", calories: 2000 }],
    [{ date: "2026-06-27", weightKg: 80 }],
    "2026-06-28"
  );
  assert.equal(result, null);
});
