import { describe, expect, it } from "vitest";
import {
  defaultMealTypeForTime,
  groupEntriesByMeal,
  mealTypeLabel,
} from "./meal-types";

describe("defaultMealTypeForTime", () => {
  it("returns breakfast before 11", () => {
    expect(defaultMealTypeForTime(new Date("2026-06-28T08:00:00"))).toBe(
      "breakfast"
    );
  });

  it("returns lunch between 11 and 15", () => {
    expect(defaultMealTypeForTime(new Date("2026-06-28T12:00:00"))).toBe(
      "lunch"
    );
  });

  it("returns snack between 15 and 17", () => {
    expect(defaultMealTypeForTime(new Date("2026-06-28T16:00:00"))).toBe(
      "snack"
    );
  });

  it("returns dinner after 17", () => {
    expect(defaultMealTypeForTime(new Date("2026-06-28T19:00:00"))).toBe(
      "dinner"
    );
  });
});

describe("groupEntriesByMeal", () => {
  it("groups in meal order with subtotals and an Other bucket", () => {
    const groups = groupEntriesByMeal([
      {
        mealType: "dinner",
        calories: 500,
        proteinG: 40,
        carbsG: 30,
        fatG: 20,
      },
      {
        mealType: "breakfast",
        calories: 400,
        proteinG: 30,
        carbsG: 40,
        fatG: 10,
      },
      {
        mealType: null,
        calories: 100,
        proteinG: 5,
        carbsG: 10,
        fatG: 2,
      },
    ]);

    expect(groups.map((group) => group.label)).toEqual([
      "Breakfast",
      "Dinner",
      "Other",
    ]);
    expect(groups[0]?.totals.calories).toBe(400);
    expect(groups[1]?.totals.proteinG).toBe(40);
    expect(groups[2]?.entries).toHaveLength(1);
  });
});

describe("mealTypeLabel", () => {
  it("labels known meals and falls back to Other", () => {
    expect(mealTypeLabel("lunch")).toBe("Lunch");
    expect(mealTypeLabel(null)).toBe("Other");
    expect(mealTypeLabel("unknown")).toBe("Other");
  });
});
