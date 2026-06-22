import type { MacroTotals } from "./types";
import { scaleMacrosFromServing, sumMacros } from "./macros";

export type WholeFoodGroup =
  | "protein"
  | "dairy"
  | "grains"
  | "produce"
  | "legumes"
  | "fats"
  | "condiments";

/** Display order for meal-builder category filters */
export const WHOLE_FOOD_GROUPS: WholeFoodGroup[] = [
  "protein",
  "dairy",
  "grains",
  "produce",
  "legumes",
  "fats",
  "condiments",
];

export interface WholeFood {
  id: string;
  name: string;
  group: WholeFoodGroup;
  /** Human-readable default portion at quantity 1, e.g. "1 large egg" */
  servingLabel: string;
  macros: MacroTotals;
  /** Extra search keywords (e.g. "mayo" → Mayonnaise) */
  searchTerms?: string[];
  /**
   * Step for +/- in meal builder. Default 0.5.
   * Use 1/12 for count foods (eggs) to support ¼, ⅓, ½ increments.
   */
  quantityStep?: number;
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
  legumes: "Legumes",
  fats: "Fats & nuts",
  condiments: "Condiments & sauces",
};

/**
 * Curated whole-food database — common meal-building ingredients with clear portions.
 * Macros are approximate averages for typical store-bought / home-prepared items.
 */
export const WHOLE_FOODS: WholeFood[] = [
  // ── Protein ──────────────────────────────────────────────────────────────
  { id: "eggs-large", name: "Eggs", group: "protein", servingLabel: "1 large", macros: { calories: 70, proteinG: 6, carbsG: 0, fatG: 5 }, quantityStep: 1 / 12 },
  { id: "egg-whites", name: "Egg whites", group: "protein", servingLabel: "1 large white", macros: { calories: 17, proteinG: 4, carbsG: 0, fatG: 0 }, quantityStep: 1 / 12 },
  { id: "chicken-breast", name: "Chicken breast", group: "protein", servingLabel: "4 oz cooked", macros: { calories: 185, proteinG: 35, carbsG: 0, fatG: 4 }, searchTerms: ["grilled chicken"] },
  { id: "chicken-thigh", name: "Chicken thigh", group: "protein", servingLabel: "4 oz cooked", macros: { calories: 230, proteinG: 28, carbsG: 0, fatG: 13 } },
  { id: "rotisserie-chicken", name: "Rotisserie chicken", group: "protein", servingLabel: "4 oz meat", macros: { calories: 190, proteinG: 25, carbsG: 0, fatG: 9 }, searchTerms: ["store chicken", "deli chicken"] },
  { id: "ground-turkey-93", name: "Ground turkey (93% lean)", group: "protein", servingLabel: "4 oz cooked", macros: { calories: 170, proteinG: 23, carbsG: 0, fatG: 8 } },
  { id: "ground-beef-90", name: "Ground beef (90% lean)", group: "protein", servingLabel: "4 oz cooked", macros: { calories: 200, proteinG: 23, carbsG: 0, fatG: 11 } },
  { id: "steak-sirloin", name: "Sirloin steak", group: "protein", servingLabel: "4 oz cooked", macros: { calories: 210, proteinG: 26, carbsG: 0, fatG: 11 }, searchTerms: ["beef steak"] },
  { id: "salmon", name: "Salmon", group: "protein", servingLabel: "4 oz cooked", macros: { calories: 235, proteinG: 25, carbsG: 0, fatG: 14 } },
  { id: "tilapia", name: "Tilapia", group: "protein", servingLabel: "4 oz cooked", macros: { calories: 145, proteinG: 30, carbsG: 0, fatG: 3 }, searchTerms: ["white fish"] },
  { id: "tuna-canned", name: "Tuna (canned in water)", group: "protein", servingLabel: "4 oz drained", macros: { calories: 120, proteinG: 26, carbsG: 0, fatG: 1 } },
  { id: "shrimp", name: "Shrimp", group: "protein", servingLabel: "4 oz cooked", macros: { calories: 120, proteinG: 23, carbsG: 1, fatG: 2 } },
  { id: "pork-tenderloin", name: "Pork tenderloin", group: "protein", servingLabel: "4 oz cooked", macros: { calories: 165, proteinG: 26, carbsG: 0, fatG: 6 } },
  { id: "bacon", name: "Bacon", group: "protein", servingLabel: "3 slices cooked", macros: { calories: 130, proteinG: 9, carbsG: 0, fatG: 10 } },
  { id: "ham-del-sliced", name: "Deli ham", group: "protein", servingLabel: "3 oz", macros: { calories: 90, proteinG: 14, carbsG: 2, fatG: 3 }, searchTerms: ["sandwich meat"] },
  { id: "turkey-del-sliced", name: "Deli turkey", group: "protein", servingLabel: "3 oz", macros: { calories: 90, proteinG: 18, carbsG: 2, fatG: 1 }, searchTerms: ["sandwich meat"] },
  { id: "roast-beef-del-sliced", name: "Deli roast beef", group: "protein", servingLabel: "3 oz", macros: { calories: 80, proteinG: 15, carbsG: 1, fatG: 2 }, searchTerms: ["sandwich meat"] },
  { id: "chicken-sausage-link", name: "Chicken sausage", group: "protein", servingLabel: "1 link", macros: { calories: 140, proteinG: 12, carbsG: 2, fatG: 9 } },
  { id: "turkey-sausage-link", name: "Turkey sausage", group: "protein", servingLabel: "1 link", macros: { calories: 120, proteinG: 13, carbsG: 1, fatG: 7 } },
  { id: "beef-jerky", name: "Beef jerky", group: "protein", servingLabel: "1 oz", macros: { calories: 80, proteinG: 13, carbsG: 3, fatG: 1 }, searchTerms: ["snack"] },
  { id: "protein-powder", name: "Whey protein powder", group: "protein", servingLabel: "1 scoop", macros: { calories: 120, proteinG: 24, carbsG: 3, fatG: 1 }, searchTerms: ["shake"] },
  { id: "tofu-firm", name: "Tofu (firm)", group: "protein", servingLabel: "4 oz", macros: { calories: 95, proteinG: 10, carbsG: 2, fatG: 5 } },
  { id: "tempeh", name: "Tempeh", group: "protein", servingLabel: "3 oz", macros: { calories: 165, proteinG: 16, carbsG: 8, fatG: 9 } },

  // ── Dairy ──────────────────────────────────────────────────────────────────
  { id: "greek-yogurt", name: "Greek yogurt (nonfat)", group: "dairy", servingLabel: "1 cup", macros: { calories: 130, proteinG: 23, carbsG: 9, fatG: 0 } },
  { id: "yogurt-regular", name: "Yogurt (low-fat)", group: "dairy", servingLabel: "1 cup", macros: { calories: 150, proteinG: 12, carbsG: 17, fatG: 4 } },
  { id: "cottage-cheese", name: "Cottage cheese (low-fat)", group: "dairy", servingLabel: "1 cup", macros: { calories: 180, proteinG: 28, carbsG: 10, fatG: 2 } },
  { id: "milk-2pct", name: "Milk (2%)", group: "dairy", servingLabel: "1 cup", macros: { calories: 120, proteinG: 8, carbsG: 12, fatG: 5 } },
  { id: "milk-whole", name: "Whole milk", group: "dairy", servingLabel: "1 cup", macros: { calories: 150, proteinG: 8, carbsG: 12, fatG: 8 }, searchTerms: ["3.25% milk", "full fat milk"] },
  { id: "milk-skim", name: "Milk (skim)", group: "dairy", servingLabel: "1 cup", macros: { calories: 85, proteinG: 8, carbsG: 12, fatG: 0 } },
  { id: "almond-milk", name: "Almond milk (unsweetened)", group: "dairy", servingLabel: "1 cup", macros: { calories: 30, proteinG: 1, carbsG: 1, fatG: 2.5 }, searchTerms: ["plant milk", "oat milk"] },
  { id: "cheese-cheddar", name: "Cheddar cheese", group: "dairy", servingLabel: "1 oz", macros: { calories: 115, proteinG: 7, carbsG: 0, fatG: 9 } },
  { id: "cheese-mozzarella", name: "Mozzarella (part-skim)", group: "dairy", servingLabel: "1 oz", macros: { calories: 72, proteinG: 7, carbsG: 1, fatG: 4 } },
  { id: "cheese-cream", name: "Cream cheese", group: "dairy", servingLabel: "2 tbsp", macros: { calories: 100, proteinG: 2, carbsG: 1, fatG: 10 }, searchTerms: ["bagel spread"] },
  { id: "cheese-parmesan", name: "Parmesan (grated)", group: "dairy", servingLabel: "2 tbsp", macros: { calories: 45, proteinG: 4, carbsG: 0, fatG: 3 } },
  { id: "cheese-feta", name: "Feta cheese", group: "dairy", servingLabel: "1 oz", macros: { calories: 75, proteinG: 4, carbsG: 1, fatG: 6 } },
  { id: "cheese-american", name: "American cheese slice", group: "dairy", servingLabel: "1 slice", macros: { calories: 70, proteinG: 4, carbsG: 1, fatG: 6 }, searchTerms: ["sandwich cheese"] },
  { id: "string-cheese", name: "String cheese", group: "dairy", servingLabel: "1 stick", macros: { calories: 80, proteinG: 7, carbsG: 1, fatG: 6 } },

  // ── Grains & starches ──────────────────────────────────────────────────────
  { id: "oatmeal", name: "Oatmeal", group: "grains", servingLabel: "1 cup cooked", macros: { calories: 150, proteinG: 5, carbsG: 27, fatG: 3 } },
  { id: "white-rice", name: "White rice", group: "grains", servingLabel: "1 cup cooked", macros: { calories: 205, proteinG: 4, carbsG: 45, fatG: 0 } },
  { id: "brown-rice", name: "Brown rice", group: "grains", servingLabel: "1 cup cooked", macros: { calories: 220, proteinG: 5, carbsG: 45, fatG: 2 } },
  { id: "quinoa", name: "Quinoa", group: "grains", servingLabel: "1 cup cooked", macros: { calories: 220, proteinG: 8, carbsG: 39, fatG: 4 } },
  { id: "sweet-potato", name: "Sweet potato", group: "grains", servingLabel: "1 medium baked", macros: { calories: 180, proteinG: 4, carbsG: 41, fatG: 0 } },
  { id: "russet-potato", name: "Potato", group: "grains", servingLabel: "1 medium baked", macros: { calories: 160, proteinG: 4, carbsG: 37, fatG: 0 } },
  { id: "corn", name: "Corn", group: "grains", servingLabel: "1 cup kernels", macros: { calories: 125, proteinG: 4, carbsG: 27, fatG: 2 } },
  { id: "whole-wheat-bread", name: "Whole wheat bread", group: "grains", servingLabel: "1 slice", macros: { calories: 80, proteinG: 4, carbsG: 14, fatG: 1 } },
  { id: "sourdough-bread", name: "Sourdough bread", group: "grains", servingLabel: "1 slice", macros: { calories: 95, proteinG: 4, carbsG: 18, fatG: 1 }, searchTerms: ["bread", "toast"] },
  { id: "white-bread", name: "White bread", group: "grains", servingLabel: "1 slice", macros: { calories: 75, proteinG: 2, carbsG: 14, fatG: 1 } },
  { id: "bagel-plain", name: "Bagel (plain)", group: "grains", servingLabel: "1 medium", macros: { calories: 280, proteinG: 11, carbsG: 56, fatG: 1.5 } },
  { id: "english-muffin", name: "English muffin", group: "grains", servingLabel: "1 muffin", macros: { calories: 130, proteinG: 5, carbsG: 26, fatG: 1 }, searchTerms: ["breakfast bread"] },
  { id: "tortilla-flour", name: "Flour tortilla (8 in)", group: "grains", servingLabel: "1 tortilla", macros: { calories: 140, proteinG: 4, carbsG: 24, fatG: 3 }, searchTerms: ["wrap"] },
  { id: "tortilla-corn", name: "Corn tortilla", group: "grains", servingLabel: "2 small", macros: { calories: 100, proteinG: 2, carbsG: 22, fatG: 1 }, searchTerms: ["taco"] },
  { id: "pasta-cooked", name: "Pasta", group: "grains", servingLabel: "1 cup cooked", macros: { calories: 220, proteinG: 8, carbsG: 43, fatG: 1 } },
  { id: "rice-cakes", name: "Rice cakes", group: "grains", servingLabel: "2 cakes", macros: { calories: 70, proteinG: 1, carbsG: 15, fatG: 0 }, searchTerms: ["snack"] },
  { id: "cream-of-rice", name: "Cream of rice", group: "grains", servingLabel: "1 cup cooked", macros: { calories: 130, proteinG: 2, carbsG: 28, fatG: 0 } },

  // ── Produce ────────────────────────────────────────────────────────────────
  { id: "banana", name: "Banana", group: "produce", servingLabel: "1 medium", macros: { calories: 105, proteinG: 1, carbsG: 27, fatG: 0 } },
  { id: "apple", name: "Apple", group: "produce", servingLabel: "1 medium", macros: { calories: 95, proteinG: 0, carbsG: 25, fatG: 0 } },
  { id: "orange", name: "Orange", group: "produce", servingLabel: "1 medium", macros: { calories: 65, proteinG: 1, carbsG: 16, fatG: 0 } },
  { id: "blueberries", name: "Blueberries", group: "produce", servingLabel: "1 cup", macros: { calories: 85, proteinG: 1, carbsG: 21, fatG: 0 } },
  { id: "strawberries", name: "Strawberries", group: "produce", servingLabel: "1 cup", macros: { calories: 50, proteinG: 1, carbsG: 12, fatG: 0 } },
  { id: "berries-mixed", name: "Mixed berries", group: "produce", servingLabel: "1 cup", macros: { calories: 70, proteinG: 1, carbsG: 17, fatG: 0 } },
  { id: "broccoli", name: "Broccoli", group: "produce", servingLabel: "1 cup chopped", macros: { calories: 55, proteinG: 4, carbsG: 11, fatG: 0 } },
  { id: "spinach", name: "Spinach", group: "produce", servingLabel: "2 cups raw", macros: { calories: 15, proteinG: 2, carbsG: 2, fatG: 0 } },
  { id: "mixed-greens", name: "Mixed greens", group: "produce", servingLabel: "2 cups", macros: { calories: 20, proteinG: 2, carbsG: 3, fatG: 0 }, searchTerms: ["salad", "lettuce"] },
  { id: "romaine", name: "Romaine lettuce", group: "produce", servingLabel: "2 cups shredded", macros: { calories: 15, proteinG: 1, carbsG: 3, fatG: 0 }, searchTerms: ["salad", "lettuce"] },
  { id: "bell-pepper", name: "Bell pepper", group: "produce", servingLabel: "1 medium", macros: { calories: 30, proteinG: 1, carbsG: 7, fatG: 0 } },
  { id: "tomato", name: "Tomato", group: "produce", servingLabel: "1 medium", macros: { calories: 25, proteinG: 1, carbsG: 5, fatG: 0 } },
  { id: "cucumber", name: "Cucumber", group: "produce", servingLabel: "1 cup sliced", macros: { calories: 16, proteinG: 1, carbsG: 4, fatG: 0 } },
  { id: "mushrooms", name: "Mushrooms", group: "produce", servingLabel: "1 cup sliced", macros: { calories: 20, proteinG: 3, carbsG: 3, fatG: 0 } },
  { id: "onion", name: "Onion", group: "produce", servingLabel: "½ cup diced", macros: { calories: 30, proteinG: 1, carbsG: 7, fatG: 0 } },
  { id: "avocado", name: "Avocado", group: "produce", servingLabel: "½ fruit", macros: { calories: 120, proteinG: 2, carbsG: 6, fatG: 11 } },
  { id: "carrots", name: "Carrots", group: "produce", servingLabel: "1 cup chopped", macros: { calories: 55, proteinG: 1, carbsG: 13, fatG: 0 } },

  // ── Legumes ───────────────────────────────────────────────────────────────
  { id: "black-beans", name: "Black beans", group: "legumes", servingLabel: "½ cup cooked", macros: { calories: 110, proteinG: 7, carbsG: 20, fatG: 0 } },
  { id: "chickpeas", name: "Chickpeas", group: "legumes", servingLabel: "½ cup cooked", macros: { calories: 135, proteinG: 7, carbsG: 22, fatG: 2 } },
  { id: "lentils", name: "Lentils", group: "legumes", servingLabel: "½ cup cooked", macros: { calories: 115, proteinG: 9, carbsG: 20, fatG: 0 } },
  { id: "edamame", name: "Edamame", group: "legumes", servingLabel: "½ cup shelled", macros: { calories: 120, proteinG: 11, carbsG: 9, fatG: 5 } },
  { id: "hummus", name: "Hummus", group: "legumes", servingLabel: "2 tbsp", macros: { calories: 70, proteinG: 2, carbsG: 6, fatG: 5 }, searchTerms: ["spread", "dip"] },

  // ── Fats & nuts ───────────────────────────────────────────────────────────
  { id: "olive-oil", name: "Olive oil", group: "fats", servingLabel: "1 tbsp", macros: { calories: 120, proteinG: 0, carbsG: 0, fatG: 14 } },
  { id: "butter", name: "Butter", group: "fats", servingLabel: "1 tbsp", macros: { calories: 100, proteinG: 0, carbsG: 0, fatG: 11 } },
  { id: "peanut-butter", name: "Peanut butter", group: "fats", servingLabel: "2 tbsp", macros: { calories: 190, proteinG: 8, carbsG: 7, fatG: 16 } },
  { id: "almond-butter", name: "Almond butter", group: "fats", servingLabel: "2 tbsp", macros: { calories: 200, proteinG: 7, carbsG: 7, fatG: 18 } },
  { id: "almonds", name: "Almonds", group: "fats", servingLabel: "1 oz (23 nuts)", macros: { calories: 165, proteinG: 6, carbsG: 6, fatG: 14 } },
  { id: "walnuts", name: "Walnuts", group: "fats", servingLabel: "1 oz", macros: { calories: 185, proteinG: 4, carbsG: 4, fatG: 18 } },
  { id: "cashews", name: "Cashews", group: "fats", servingLabel: "1 oz", macros: { calories: 160, proteinG: 5, carbsG: 9, fatG: 13 } },

  // ── Condiments & sauces ───────────────────────────────────────────────────
  { id: "mayonnaise", name: "Mayonnaise", group: "condiments", servingLabel: "1 tbsp", macros: { calories: 100, proteinG: 0, carbsG: 0, fatG: 11 }, searchTerms: ["mayo"] },
  { id: "mustard", name: "Mustard", group: "condiments", servingLabel: "1 tbsp", macros: { calories: 10, proteinG: 0, carbsG: 1, fatG: 0 } },
  { id: "ketchup", name: "Ketchup", group: "condiments", servingLabel: "1 tbsp", macros: { calories: 20, proteinG: 0, carbsG: 5, fatG: 0 } },
  { id: "salsa", name: "Salsa", group: "condiments", servingLabel: "2 tbsp", macros: { calories: 10, proteinG: 0, carbsG: 2, fatG: 0 } },
  { id: "hot-sauce", name: "Hot sauce", group: "condiments", servingLabel: "1 tsp", macros: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 } },
  { id: "soy-sauce", name: "Soy sauce", group: "condiments", servingLabel: "1 tbsp", macros: { calories: 10, proteinG: 2, carbsG: 1, fatG: 0 } },
  { id: "ranch-dressing", name: "Ranch dressing", group: "condiments", servingLabel: "2 tbsp", macros: { calories: 140, proteinG: 0, carbsG: 2, fatG: 14 }, searchTerms: ["salad dressing"] },
  { id: "vinaigrette", name: "Vinaigrette", group: "condiments", servingLabel: "2 tbsp", macros: { calories: 90, proteinG: 0, carbsG: 3, fatG: 9 }, searchTerms: ["salad dressing", "balsamic"] },
  { id: "marinara-sauce", name: "Marinara sauce", group: "condiments", servingLabel: "½ cup", macros: { calories: 70, proteinG: 2, carbsG: 12, fatG: 2 }, searchTerms: ["pasta sauce", "tomato sauce"] },
  { id: "bbq-sauce", name: "BBQ sauce", group: "condiments", servingLabel: "2 tbsp", macros: { calories: 70, proteinG: 0, carbsG: 17, fatG: 0 } },
  { id: "honey", name: "Honey", group: "condiments", servingLabel: "1 tbsp", macros: { calories: 64, proteinG: 0, carbsG: 17, fatG: 0 } },
  { id: "maple-syrup", name: "Maple syrup", group: "condiments", servingLabel: "1 tbsp", macros: { calories: 52, proteinG: 0, carbsG: 13, fatG: 0 }, searchTerms: ["pancake syrup"] },
  { id: "guacamole", name: "Guacamole", group: "condiments", servingLabel: "2 tbsp", macros: { calories: 50, proteinG: 1, carbsG: 3, fatG: 4 }, searchTerms: ["avocado dip"] },
];

export function getWholeFoodById(id: string): WholeFood | undefined {
  return WHOLE_FOODS.find((food) => food.id === id);
}

export const DEFAULT_QUANTITY_STEP = 0.5;
/** Twelfth increments — supports ¼, ⅓, ½, ⅔, ¾ per unit */
export const FRACTIONAL_QUANTITY_STEP = 1 / 12;

export function getQuantityStep(foodId: string): number {
  return getWholeFoodById(foodId)?.quantityStep ?? DEFAULT_QUANTITY_STEP;
}

export function adjustQuantity(
  current: number,
  foodId: string,
  direction: 1 | -1
): number {
  const ladder = getQuantityLadder(foodId);
  if (ladder) {
    let idx = ladder.findIndex((v) => v >= current - 0.01);
    if (idx === -1) idx = ladder.length - 1;
    if (direction === 1) {
      return ladder[Math.min(idx + 1, ladder.length - 1)] ?? current;
    }
    const prevIdx = ladder[idx]! > current + 0.01 ? idx - 1 : idx - 1;
    return ladder[Math.max(prevIdx, 0)] ?? 0;
  }

  const step = getQuantityStep(foodId);
  const units = Math.round(current / step);
  const next = Math.max(0, units + direction) * step;
  return snapQuantity(next, step);
}

/** Quarter / third / half ladder for count-based foods (eggs, etc.) */
function buildCountFoodLadder(maxWhole: number): number[] {
  const fracs = [0.25, 1 / 3, 0.5, 2 / 3, 0.75];
  const values = new Set<number>();
  for (let whole = 0; whole <= maxWhole; whole++) {
    if (whole > 0) values.add(whole);
    for (const frac of fracs) {
      const v = snapQuantity(whole + frac, FRACTIONAL_QUANTITY_STEP);
      if (v > 0 && v <= maxWhole) values.add(v);
    }
  }
  return [...values].sort((a, b) => a - b);
}

function getQuantityLadder(foodId: string): number[] | null {
  if (Math.abs(getQuantityStep(foodId) - FRACTIONAL_QUANTITY_STEP) < 0.001) {
    return buildCountFoodLadder(12);
  }
  return null;
}

function snapQuantity(value: number, step: number): number {
  if (step === FRACTIONAL_QUANTITY_STEP) {
    return Math.round(value * 12) / 12;
  }
  return Math.round(value * 10) / 10;
}

/** Display quantity — shows ¼, ⅓, ½, 1, 1½ for twelfth-step foods */
export function formatQuantity(quantity: number, foodId?: string): string {
  const step = foodId ? getQuantityStep(foodId) : DEFAULT_QUANTITY_STEP;
  if (Math.abs(step - FRACTIONAL_QUANTITY_STEP) < 0.001) {
    return formatTwelfthQuantity(quantity);
  }
  return Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(1);
}

function formatTwelfthQuantity(quantity: number): string {
  const twelfths = Math.round(quantity * 12);
  if (twelfths <= 0) return "0";

  const whole = Math.floor(twelfths / 12);
  const rem = twelfths % 12;
  const frac: Record<number, string> = {
    3: "¼",
    4: "⅓",
    6: "½",
    8: "⅔",
    9: "¾",
  };

  if (whole === 0) {
    return frac[rem] ?? String(round1(quantity));
  }
  if (rem === 0) {
    return String(whole);
  }
  return `${whole}${frac[rem] ?? ""}`;
}

/** Portion line for a line item, e.g. "2 large" or "½ large" */
export function formatLineItemPortion(foodId: string, quantity: number): string {
  const food = getWholeFoodById(foodId);
  if (!food) return `× ${formatQuantity(quantity)}`;

  const qLabel = formatQuantity(quantity, foodId);

  if (Math.abs(getQuantityStep(foodId) - FRACTIONAL_QUANTITY_STEP) < 0.001) {
    const unit = food.servingLabel.replace(/^1\s+/, "");
    return `${qLabel} ${unit}`;
  }

  if (quantity === 1) return food.servingLabel;
  return `${qLabel} × ${food.servingLabel}`;
}

export function searchWholeFoods(query: string, group?: WholeFoodGroup): WholeFood[] {
  const normalized = query.trim().toLowerCase();
  return WHOLE_FOODS.filter((food) => {
    if (group && food.group !== group) return false;
    if (!normalized) return true;
    return (
      food.name.toLowerCase().includes(normalized) ||
      food.servingLabel.toLowerCase().includes(normalized) ||
      food.searchTerms?.some((term) => term.toLowerCase().includes(normalized))
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
