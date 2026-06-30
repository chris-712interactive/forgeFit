import assert from "node:assert/strict";
import test from "node:test";
import { parseMfpDiaryCsv } from "./mfp-csv-parser";

test("parseMfpDiaryCsv maps standard MFP export columns", () => {
  const csv = [
    "Date,Meal,Food,Calories,Fat (g),Protein (g),Carbohydrates (g)",
    "06/18/2026,Breakfast,Greek yogurt,150,2,15,12",
    "06/18/2026,Lunch,Chicken rice bowl,520,10,42,55",
  ].join("\n");

  const result = parseMfpDiaryCsv(csv, { todayIso: "2026-06-30" });

  assert.equal(result.errors.length, 0);
  assert.equal(result.rows.length, 2);
  assert.equal(result.rows[0]?.loggedDate, "2026-06-18");
  assert.equal(result.rows[0]?.mealType, "breakfast");
  assert.equal(result.rows[0]?.foodName, "Greek yogurt");
  assert.equal(result.rows[0]?.calories, 150);
  assert.equal(result.rows[1]?.mealType, "lunch");
});

test("parseMfpDiaryCsv skips rows outside lookback window", () => {
  const csv = [
    "Date,Meal,Food,Calories,Protein (g)",
    "01/01/2020,Breakfast,Old entry,100,10",
    "06/29/2026,Dinner,Recent entry,400,30",
  ].join("\n");

  const result = parseMfpDiaryCsv(csv, { todayIso: "2026-06-30" });

  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0]?.foodName, "Recent entry");
  assert.equal(result.skipped, 1);
});
