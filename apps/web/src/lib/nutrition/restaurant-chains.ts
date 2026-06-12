/** Curated US chain items — macros are approximate from published nutrition pages. */

export interface RestaurantChain {
  id: string;
  name: string;
  nutritionUrl: string;
}

export interface RestaurantMenuItem {
  id: string;
  chainId: string;
  name: string;
  servingDescription: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export const RESTAURANT_CHAINS: readonly RestaurantChain[] = [
  {
    id: "chipotle",
    name: "Chipotle",
    nutritionUrl: "https://www.chipotle.com/nutrition-calculator",
  },
  {
    id: "mcdonalds",
    name: "McDonald's",
    nutritionUrl: "https://www.mcdonalds.com/us/en-us/about-our-food/nutrition-calculator.html",
  },
  {
    id: "subway",
    name: "Subway",
    nutritionUrl: "https://www.subway.com/en-us/menunutrition/nutrition",
  },
  {
    id: "chickfila",
    name: "Chick-fil-A",
    nutritionUrl: "https://www.chick-fil-a.com/nutrition-allergens",
  },
  {
    id: "wendys",
    name: "Wendy's",
    nutritionUrl: "https://www.wendys.com/nutrition",
  },
  {
    id: "tacobell",
    name: "Taco Bell",
    nutritionUrl: "https://www.tacobell.com/nutrition/info",
  },
  {
    id: "starbucks",
    name: "Starbucks",
    nutritionUrl: "https://www.starbucks.com/menu/nutrition-info",
  },
  {
    id: "panera",
    name: "Panera",
    nutritionUrl: "https://www.panerabread.com/en-us/menu/nutrition.html",
  },
  {
    id: "sweetgreen",
    name: "Sweetgreen",
    nutritionUrl: "https://www.sweetgreen.com/menu",
  },
  {
    id: "cava",
    name: "Cava",
    nutritionUrl: "https://cava.com/menu",
  },
  {
    id: "shakeshack",
    name: "Shake Shack",
    nutritionUrl: "https://www.shakeshack.com/nutrition",
  },
  {
    id: "panda",
    name: "Panda Express",
    nutritionUrl: "https://www.pandaexpress.com/nutrition",
  },
  {
    id: "popeyes",
    name: "Popeyes",
    nutritionUrl: "https://www.popeyes.com/nutrition",
  },
  {
    id: "fiveguys",
    name: "Five Guys",
    nutritionUrl: "https://www.fiveguys.com/menu/nutrition-info",
  },
  {
    id: "in-n-out",
    name: "In-N-Out",
    nutritionUrl: "https://www.in-n-out.com/menu",
  },
] as const;

export const RESTAURANT_MENU_ITEMS: readonly RestaurantMenuItem[] = [
  {
    id: "chipotle-chicken-bowl",
    chainId: "chipotle",
    name: "Chicken bowl (typical)",
    servingDescription: "1 bowl · rice, chicken, beans, salsa",
    calories: 665,
    proteinG: 42,
    carbsG: 65,
    fatG: 22,
  },
  {
    id: "chipotle-steak-burrito",
    chainId: "chipotle",
    name: "Steak burrito",
    servingDescription: "1 burrito · full toppings",
    calories: 820,
    proteinG: 48,
    carbsG: 78,
    fatG: 32,
  },
  {
    id: "mcdonalds-big-mac",
    chainId: "mcdonalds",
    name: "Big Mac",
    servingDescription: "1 sandwich",
    calories: 590,
    proteinG: 26,
    carbsG: 46,
    fatG: 34,
  },
  {
    id: "mcdonalds-10-nuggets",
    chainId: "mcdonalds",
    name: "10 pc Chicken McNuggets",
    servingDescription: "10 pieces",
    calories: 410,
    proteinG: 23,
    carbsG: 26,
    fatG: 24,
  },
  {
    id: "subway-6-turkey",
    chainId: "subway",
    name: "6\" Turkey Breast",
    servingDescription: "6 inch · wheat, veggies",
    calories: 280,
    proteinG: 18,
    carbsG: 40,
    fatG: 4,
  },
  {
    id: "subway-6-chicken",
    chainId: "subway",
    name: "6\" Grilled Chicken",
    servingDescription: "6 inch · wheat, veggies",
    calories: 320,
    proteinG: 26,
    carbsG: 40,
    fatG: 5,
  },
  {
    id: "chickfila-sandwich",
    chainId: "chickfila",
    name: "Chick-fil-A Sandwich",
    servingDescription: "1 sandwich",
    calories: 440,
    proteinG: 28,
    carbsG: 40,
    fatG: 19,
  },
  {
    id: "chickfila-nuggets-8",
    chainId: "chickfila",
    name: "8 ct Nuggets",
    servingDescription: "8 pieces",
    calories: 250,
    proteinG: 27,
    carbsG: 11,
    fatG: 11,
  },
  {
    id: "wendys-daves-single",
    chainId: "wendys",
    name: "Dave's Single",
    servingDescription: "1 burger",
    calories: 590,
    proteinG: 29,
    carbsG: 39,
    fatG: 34,
  },
  {
    id: "tacobell-crunchwrap",
    chainId: "tacobell",
    name: "Beef Crunchwrap Supreme",
    servingDescription: "1 wrap",
    calories: 530,
    proteinG: 16,
    carbsG: 47,
    fatG: 30,
  },
  {
    id: "starbucks-egg-bites",
    chainId: "starbucks",
    name: "Egg White & Roasted Red Pepper Bites",
    servingDescription: "2 bites",
    calories: 170,
    proteinG: 13,
    carbsG: 11,
    fatG: 8,
  },
  {
    id: "starbucks-protein-box",
    chainId: "starbucks",
    name: "Protein Box",
    servingDescription: "1 box · eggs, cheese, fruit, peanut butter",
    calories: 470,
    proteinG: 23,
    carbsG: 39,
    fatG: 24,
  },
  {
    id: "panera-chicken-salad",
    chainId: "panera",
    name: "Green Goddess Cobb Salad w/ Chicken",
    servingDescription: "1 whole salad",
    calories: 550,
    proteinG: 42,
    carbsG: 18,
    fatG: 35,
  },
  {
    id: "sweetgreen-harvest",
    chainId: "sweetgreen",
    name: "Harvest Bowl",
    servingDescription: "1 bowl",
    calories: 565,
    proteinG: 20,
    carbsG: 58,
    fatG: 28,
  },
  {
    id: "cava-grains-greens",
    chainId: "cava",
    name: "Grains + Greens w/ Chicken",
    servingDescription: "1 bowl · typical build",
    calories: 610,
    proteinG: 42,
    carbsG: 52,
    fatG: 24,
  },
  {
    id: "shakeshack-shackburger",
    chainId: "shakeshack",
    name: "ShackBurger",
    servingDescription: "1 burger",
    calories: 530,
    proteinG: 28,
    carbsG: 27,
    fatG: 34,
  },
  {
    id: "panda-orange-chicken",
    chainId: "panda",
    name: "Orange Chicken",
    servingDescription: "1 entree portion",
    calories: 490,
    proteinG: 25,
    carbsG: 51,
    fatG: 23,
  },
  {
    id: "popeyes-3-piece",
    chainId: "popeyes",
    name: "3 pc Tenders",
    servingDescription: "3 tenders",
    calories: 380,
    proteinG: 35,
    carbsG: 18,
    fatG: 18,
  },
  {
    id: "fiveguys-little-burger",
    chainId: "fiveguys",
    name: "Little Hamburger",
    servingDescription: "1 burger",
    calories: 480,
    proteinG: 23,
    carbsG: 39,
    fatG: 26,
  },
  {
    id: "innout-double-double",
    chainId: "in-n-out",
    name: "Double-Double",
    servingDescription: "1 burger · protein style optional",
    calories: 670,
    proteinG: 37,
    carbsG: 39,
    fatG: 41,
  },
] as const;

const chainById = new Map(RESTAURANT_CHAINS.map((chain) => [chain.id, chain]));

export function getRestaurantChain(chainId: string): RestaurantChain | undefined {
  return chainById.get(chainId);
}

export interface RestaurantSearchHit {
  chain: RestaurantChain;
  item: RestaurantMenuItem;
}

export function searchRestaurantMenu(query: string, limit = 20): RestaurantSearchHit[] {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 2) return [];

  const hits: RestaurantSearchHit[] = [];
  for (const item of RESTAURANT_MENU_ITEMS) {
    const chain = chainById.get(item.chainId);
    if (!chain) continue;

    const haystack = `${chain.name} ${item.name} ${item.servingDescription}`.toLowerCase();
    if (!haystack.includes(normalized)) continue;

    hits.push({ chain, item });
    if (hits.length >= limit) break;
  }

  return hits;
}

export function listRestaurantChains(): RestaurantChain[] {
  return [...RESTAURANT_CHAINS];
}
