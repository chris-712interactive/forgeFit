import assert from "node:assert/strict";
import test from "node:test";
import {
  buildNutritionHref,
  minNutritionLogDate,
  resolveNutritionDateParam,
} from "./date-param";

test("resolveNutritionDateParam clamps future and invalid dates to today", () => {
  const today = "2026-06-28";
  assert.equal(resolveNutritionDateParam(null, today), today);
  assert.equal(resolveNutritionDateParam("not-a-date", today), today);
  assert.equal(resolveNutritionDateParam("2026-07-01", today), today);
});

test("resolveNutritionDateParam clamps dates beyond lookback window", () => {
  const today = "2026-06-28";
  assert.equal(
    resolveNutritionDateParam("2020-01-01", today),
    minNutritionLogDate(today)
  );
});

test("buildNutritionHref preserves date and tab", () => {
  assert.equal(
    buildNutritionHref({ date: "2026-06-26", tab: "browse" }),
    "/nutrition?date=2026-06-26&tab=browse"
  );
});
