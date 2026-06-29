import { describe, expect, it } from "vitest";
import { computeMealBudgets, getMealBudget } from "./meal-budgets";

describe("computeMealBudgets", () => {
  it("splits daily targets into meal shares", () => {
    const budgets = computeMealBudgets({
      calories: 2000,
      proteinG: 160,
      carbsG: 200,
      fatG: 65,
      proteinRuleId: "test",
      calorieRuleId: "test",
    });

    expect(budgets).not.toBeNull();
    expect(budgets!.find((b) => b.mealType === "breakfast")).toEqual({
      mealType: "breakfast",
      calories: 500,
      proteinG: 40,
      carbsG: 50,
      fatG: 16,
    });
    expect(budgets!.find((b) => b.mealType === "dinner")?.calories).toBe(700);
  });

  it("returns null without targets", () => {
    expect(computeMealBudgets(null)).toBeNull();
  });
});

describe("getMealBudget", () => {
  it("finds a meal budget by type", () => {
    const budgets = computeMealBudgets({
      calories: 2400,
      proteinG: 180,
      carbsG: 240,
      fatG: 70,
      proteinRuleId: "test",
      calorieRuleId: "test",
    });
    const lunch = getMealBudget(budgets, "lunch");
    expect(lunch?.proteinG).toBe(54);
  });
});
