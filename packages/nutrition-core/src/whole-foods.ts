import type { MacroTotals } from "./types";
import { scaleMacrosFromServing, sumMacros } from "./macros";

export type WholeFoodGroup =
  | "protein"
  | "dairy"
  | "grains"
  | "produce"
  | "fats"
  | "legumes";

export interface WholeFood {
  id: string;
  name: string;
  group: WholeFoodGroup;
  /** Human-readable default portion at quantity 1, e.g. "2 large eggs" */
  servingLabel: string;
  macros: MacroTotals;
}

export interface MealLineItem {
  id: string;
  foodId: string;
  foodName: string;
  servingLabel: string;
  quantity: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export const WHOLE_FOOD_GROUP_LABELS: Record<WholeFoodGroup, string> = {
  protein: "Protein",
  dairy: "Dairy",
  grains: "Grains & starches",
  produce: "Produce",
  fats: "Fats & nuts",
  legumes: "Legumes",
};

/** Curated whole-food database — common meal-building ingredients with clear portions. */
export const WHOLE_FOODS: WholeFood[] = [
  // Protein
  { id: "eggs-large", name: "Eggs", group: "protein", servingLabel: "2 large", macros: { calories: 140, proteinG: 12, carbsG: 1, fatG: 10 } },
  { id: "egg-whites", name: "Egg whites", group: "protein", servingLabel: "4 large", macros: { calories: 68, proteinG: 14, carbsG: 1, fatG: 0 } },
  { id: "chicken-breast", name: "Chicken breast", group: "protein", servingLabel: "4 oz cooked", macros: { calories: 185, proteinG: 35, carbsG: 0, fatG: 4 } },
  { id: "chicken-thigh", name: "Chicken thigh", group: "protein", servingLabel: "4 oz cooked", macros: { calories: 230, proteinG: 28, carbsG: 0, fatG: 13 } },
  { id: "ground-turkey-93", name: "Ground turkey (93% lean)", group: "protein", servingLabel: "4 oz cooked", macros: { calories: 170, proteinG: 23, carbsG: 0, fatG: 8 } },
  { id: "ground-beef-90", name: "Ground beef (90% lean)", group: "protein", servingLabel: "4 oz cooked", macros: { calories: 200, proteinG: 23, carbsG: 0, fatG: 11 } },
  { id: "steak-sirloin", name: "Sirloin steak", group: "protein", servingLabel: "4 oz cooked", macros: { calories: 210, proteinG: 26, carbsG: 0, fatG: 11 } },
  { id: "salmon", name: "Salmon", group: "protein", servingLabel: "4 oz cooked", macros: { calories: 235, proteinG: 25, carbsG: 0, fatG: 14 } },
  { id: "tilapia", name: "Tilapia", group: "protein", servingLabel: "4 oz cooked", macros: { calories: 145, proteinG: 30, carbsG: 0, fatG: 3 } },
  { id: "tuna-canned", name: "Tuna (canned in water)", group: "protein", servingLabel: "4 oz drained", macros: { calories: 120, proteinG: 26, carbsG: 0, fatG: 1 } },
  { id: "shrimp", name: "Shrimp", group: "protein", servingLabel: "4 oz cooked", macros: { calories: 120, proteinG: 23, carbsG: 1, fatG: 2 } },
  { id: "pork-tenderloin", name: "Pork tenderloin", group: "protein", servingLabel: "4 oz cooked", macros: { calories: 165, proteinG: 26, carbsG: 0, fatG: 6 } },
  { id: "ham-del-sliced", name: "Deli ham", group: "protein", servingLabel: "3 oz", macros: { calories: 90, proteinG: 14, carbsG: 2, fatG: 3 } },
  { id: "turkey-del-sliced", name: "Deli turkey", group: "protein", servingLabel: "3 oz", macros: { calories: 90, proteinG: 18, carbsG: 2, fatG: 1 } },
  { id: "protein-powder", name: "Whey protein powder", group: "protein", servingLabel: "1 scoop", macros: { calories: 120, proteinG: 24, carbsG: 3, fatG: 1 } },
  { id: "tofu-firm", name: "Tofu (firm)", group: "protein", servingLabel: "4 oz", macros: { calories: 95, proteinG: 10, carbsG: 2, fatG: 5 } },
  { id: "tempeh", name: "Tempeh", group: "protein", servingLabel: "3 oz", macros: { calories: 165, proteinG: 16, carbsG: 8, fatG: 9 } },
  // Dairy
  { id: "greek-yogurt", name: "Greek yogurt (nonfat)", group: "dairy", servingLabel: "1 cup", macros: { calories: 130, proteinG: 23, carbsG: 9, fatG: 0 } },
  { id: "cottage-cheese", name: "Cottage cheese (low-fat)", group: "dairy", servingLabel: "1 cup", macros: { calories: 180, proteinG: 28, carbsG: 10, fatG: 2 } },
  { id: "milk-2pct", name: "Milk (2%)", group: "dairy", servingLabel: "1 cup", macros: { calories: 120, proteinG: 8, carbsG: 12, fatG: 5 } },
  { id: "cheese-cheddar", name: "Cheddar cheese", group: "dairy", servingLabel: "1 oz", macros: { calories: 115, proteinG: 7, carbsG: 0, fatG: 9 } },
  { id: "mozzarella-part-skim", name: "Mozzarella (part-skim)", group: "dairy", servingLabel: "1 oz", macros: { calories: 72, proteinG: 7, carbsG: 1, fatG: 4 } },
  { id: "string-cheese", name: "String cheese", group: "dairy", servingLabel: "1 stick", macros: { calories: 80, proteinG: 7, carbsG: 1, fatG: 6 } },
  // Grains
  { id: "oatmeal", name: "Oatmeal", group: "grains", servingLabel: "1 cup cooked", macros: { calories: 150, proteinG: 5, carbsG: 27, fatG: 3 } },
  { id: "white-rice", name: "White rice", group: "grains", servingLabel: "1 cup cooked", macros: { calories: 205, proteinG: 4, carbsG: 45, fatG: 0 } },
  { id: "brown-rice", name: "Brown rice", group: "grains", servingLabel: "1 cup cooked", macros: { calories: 220, proteinG: 5, carbsG: 45, fatG: 2 } },
  { id: "quinoa", name: "Quinoa", group: "grains", servingLabel: "1 cup cooked", macros: { calories: 220, proteinG: 8, carbsG: 39, fatG: 4 } },
  { id: "sweet-potato", name: "Sweet potato", group: "grains", servingLabel: "1 medium baked", macros: { calories: 180, proteinG: 4, carbsG: 41, fatG: 0 } },
  { id: "russet-potato", name: "Potato", group: "grains", servingLabel: "1 medium baked", macros: { calories: 160, proteinG: 4, carbsG: 37, fatG: 0 } },
  { id: "whole-wheat-bread", name: "Whole wheat bread", group: "grains", servingLabel: "1 slice", macros: { calories: 80, proteinG: 4, carbsG: 14, fatG: 1 } },
  { id: "tortilla-flour", name: "Flour tortilla (8 in)", group: "grains", servingLabel: "1 tortilla", macros: { calories: 140, proteinG: 4, carbsG: 24, fatG: 3 } },
  { id: "tortilla-corn", name: "Corn tortilla", group: "grains", servingLabel: "2 small", macros: { calories: 100, proteinG: 2, carbsG: 22, fatG: 1 } },
  { id: "pasta-cooked", name: "Pasta", group: "grains", servingLabel: "1 cup cooked", macros: { calories: 220, proteinG: 8, carbsG: 43, fatG: 1 } },
  { id: "cream-of-rice", name: "Cream of rice", group: "grains", servingLabel: "1 cup cooked", macros: { calories: 130, proteinG: 2, carbsG: 28, fatG: 0 } },
  // Produce
  { id: "banana", name: "Banana", group: "produce", servingLabel: "1 medium", macros: { calories: 105, proteinG: 1, carbsG: 27, fatG: 0 } },
  { id: "apple", name: "Apple", group: "produce", servingLabel: "1 medium", macros: { calories: 95, proteinG: 0, carbsG: 25, fatG: 0 } },
  { id: "blueberries", name: "Blueberries", group: "produce", servingLabel: "1 cup", macros: { calories: 85, proteinG: 1, carbsG: 21, fatG: 0 } },
  { id: "strawberries", name: "Strawberries", group: "produce", servingLabel: "1 cup", macros: { calories: 50, proteinG: 1, carbsG: 12, fatG: 0 } },
  { id: "broccoli", name: "Broccoli", group: "produce", servingLabel: "1 cup chopped", macros: { calories: 55, proteinG: 4, carbsG: 11, fatG: 0 } },
  { id: "spinach", name: "Spinach", group: "produce", servingLabel: "2 cups raw", macros: { calories: 15, proteinG: 2, carbsG: 2, fatG: 0 } },
  { id: "mixed-greens", name: "Mixed greens", group: "produce", servingLabel: "2 cups", macros: { calories: 20, proteinG: 2, carbsG: 3, fatG: 0 } },
  { id: "bell-pepper", name: "Bell pepper", group: "produce", servingLabel: "1 medium", macros: { calories: 30, proteinG: 1, carbsG: 7, fatG: 0 } },
  { id: "tomato", name: "Tomato", group: "produce", servingLabel: "1 medium", macros: { calories: 25, proteinG: 1, carbsG: 5, fatG: 0 } },
  { id: "avocado", name: "Avocado", group: "produce", servingLabel: "½ fruit", macros: { calories: 120, proteinG: 2, carbsG: 6, fatG: 11 } },
  { id: "carrots", name: "Carrots", group: "produce", servingLabel: "1 cup chopped", macros: { calories: 55, proteinG: 1, carbsG: 13, fatG: 0 } },
  { id: "berries-mixed", name: "Mixed berries", group: "produce", servingLabel: "1 cup", macros: { calories: 70, proteinG: 1, carbsG: 17, fatG: 0 } },
  // Fats
  { id: "olive-oil", name: "Olive oil", group: "fats", servingLabel: "1 tbsp", macros: { calories: 120, proteinG: 0, carbsG: 0, fatG: 14 } },
  { id: "butter", name: "Butter", group: "fats", servingLabel: "1 tbsp", macros: { calories: 100, proteinG: 0, carbsG: 0, fatG: 11 } },
  { id: "peanut-butter", name: "Peanut butter", group: "fats", servingLabel: "2 tbsp", macros: { calories: 190, proteinG: 8, carbsG: 7, fatG: 16 } },
  { id: "almonds", name: "Almonds", group: "fats", servingLabel: "1 oz (23 nuts)", macros: { calories: 165, proteinG: 6, carbsG: 6, fatG: 14 } },
  { id: "walnuts", name: "Walnuts", group: "fats", servingLabel: "1 oz", macros: { calories: 185, proteinG: 4, carbsG: 4, fatG: 18 } },
  { id: "almond-butter", name: "Almond butter", group: "fats", servingLabel: "2 tbsp", macros: { calories: 200, proteinG: 7, carbsG: 7, fatG: 18 } },
  // Legumes
  { id: "black-beans", name: "Black beans", group: "legumes", servingLabel: "½ cup cooked", macros: { calories: 110, proteinG: 7, carbsG: 20, fatG: 0 } },
  { id: "chickpeas", name: "Chickpeas", group: "legumes", servingLabel: "½ cup cooked", macros: { calories: 135, proteinG: 7, carbsG: 22, fatG: 2 } },
  { id: "lentils", name: "Lentils", group: "legumes", servingLabel: "½ cup cooked", macros: { calories: 115, proteinG: 9, carbsG: 20, fatG: 0 } },
  { id: "edamame", name: "Edamame", group: "legumes", servingLabel: "½ cup shelled", macros: { calories: 120, proteinG: 11, carbsG: 9, fatG: 5 } },
];

export function getWholeFoodById(id: string): WholeFood | undefined {
  return WHOLE_FOODS.find((food) => food.id === id);
}

export function searchWholeFoods(query: string, group?: WholeFoodGroup): WholeFood[] {
  const normalized = query.trim().toLowerCase();
  return WHOLE_FOODS.filter((food) => {
    if (group && food.group !== group) return false;
    if (!normalized) return true;
    return (
      food.name.toLowerCase().includes(normalized) ||
      food.servingLabel.toLowerCase().includes(normalized)
    );
  });
}

export function createLineItemId(): string {
  return `line-${crypto.randomUUID()}`;
}

export function buildLineItem(food: WholeFood, quantity: number): MealLineItem {
  const macros = scaleMacrosFromServing(food.macros, quantity);
  return {
    id: createLineItemId(),
    foodId: food.id,
    foodName: food.name,
    servingLabel: food.servingLabel,
    quantity,
    ...macros,
  };
}

export function rescaleLineItem(item: MealLineItem, quantity: number): MealLineItem {
  const food = getWholeFoodById(item.foodId);
  if (!food) {
    const factor = quantity / Math.max(item.quantity, 0.01);
    return {
      ...item,
      quantity,
      calories: Math.round(item.calories * factor),
      proteinG: round1(item.proteinG * factor),
      carbsG: round1(item.carbsG * factor),
      fatG: round1(item.fatG * factor),
    };
  }
  return { ...buildLineItem(food, quantity), id: item.id };
}

export function lineItemToMacros(item: MealLineItem): MacroTotals {
  return {
    calories: item.calories,
    proteinG: item.proteinG,
    carbsG: item.carbsG,
    fatG: item.fatG,
  };
}

export function sumLineItems(items: MealLineItem[]): MacroTotals {
  return sumMacros(items.map(lineItemToMacros));
}

export function cloneLineItems(items: MealLineItem[]): MealLineItem[] {
  return items.map((item) => ({ ...item, id: createLineItemId() }));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
