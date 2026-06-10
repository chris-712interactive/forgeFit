"use client";

import {
  buildMealPlateExamples,
  FOOD_ROLE_COLORS,
  sumPlateMacros,
  type MealPlateExample,
} from "@/lib/nutrition/meal-plates";
import type { NutritionTargets } from "@forgefit/program-engine";

interface MealPlateExamplesProps {
  targets: NutritionTargets | null;
}

export function MealPlateExamples({ targets }: MealPlateExamplesProps) {
  const plates = buildMealPlateExamples(targets);
  if (plates.length === 0) return null;

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
        Example plates for your day
      </h2>
      <p className="mt-1 text-sm text-forge-muted">
        Sample breakfasts, lunches, and dinners scaled to hit your per-meal targets.
        Portions adjust to your program — swap foods freely as long as the macros
        stay in the ballpark.
      </p>

      <div className="mt-5 space-y-6">
        {plates.map((plate) => (
          <MealPlateCard key={plate.meal} plate={plate} />
        ))}
      </div>
    </section>
  );
}

function MealPlateCard({ plate }: { plate: MealPlateExample }) {
  const exampleTotals = sumPlateMacros(plate.foods);
  const calorieGap = plate.targets.calories - exampleTotals.calories;
  const closeMatch = Math.abs(calorieGap) <= Math.max(25, plate.targets.calories * 0.05);

  return (
    <article className="rounded-xl border border-[var(--border)] bg-forge-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold text-forge-text">
            <span className="mr-2" aria-hidden>
              {plate.emoji}
            </span>
            {plate.label}
          </h3>
          <p className="mt-0.5 text-xs text-forge-muted">{plate.shareLabel}</p>
        </div>
        <div className="shrink-0 text-right text-xs text-forge-muted">
          <p className="font-semibold text-forge-text">
            ~{plate.targets.calories} kcal
          </p>
          <p>
            {plate.targets.proteinG}g P · {plate.targets.carbsG}g C ·{" "}
            {plate.targets.fatG}g F
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <PlateVisual foods={plate.foods} />

        <ul className="w-full flex-1 space-y-2">
          {plate.foods.map((food) => (
            <li
              key={`${plate.meal}-${food.name}`}
              className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm ${FOOD_ROLE_COLORS[food.role]}`}
            >
              <div>
                <p className="font-medium">{food.name}</p>
                <p className="text-xs opacity-80">{food.portion}</p>
              </div>
              <span className="shrink-0 text-xs font-medium opacity-90">
                {food.macros.proteinG}p · {food.macros.carbsG}c · {food.macros.fatG}f
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 text-xs text-forge-muted">
        <span className={closeMatch ? "text-forge-success" : "text-forge-text"}>
          Plate totals: {exampleTotals.calories} kcal · {exampleTotals.proteinG}g
          protein · {exampleTotals.carbsG}g carbs · {exampleTotals.fatG}g fat
        </span>
        {closeMatch ? (
          <span className="text-forge-success"> · matches meal target</span>
        ) : (
          <span>
            {" "}
            · target {plate.targets.calories} kcal ({calorieGap > 0 ? "+" : ""}
            {calorieGap} kcal)
          </span>
        )}
      </p>
    </article>
  );
}

function PlateVisual({
  foods,
}: {
  foods: MealPlateExample["foods"];
}) {
  const quadrants = [
    foods.find((f) => f.role === "protein"),
    foods.find((f) => f.role === "carbs"),
    foods.find((f) => f.role === "produce"),
    foods.find((f) => f.role === "fat") ?? foods.find((f) => f.role === "carbs"),
  ].filter((f): f is MealPlateExample["foods"][number] => f != null);

  return (
    <div
      className="relative mx-auto h-36 w-36 shrink-0 rounded-full border-4 border-forge-muted/30 bg-forge-surface-raised shadow-inner sm:mx-0"
      aria-hidden
    >
      <div className="absolute inset-2 grid grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-full">
        {quadrants.slice(0, 4).map((food, index) => (
          <div
            key={`${food.name}-${index}`}
            className={`flex items-center justify-center p-1 text-center text-[9px] font-semibold leading-tight ${FOOD_ROLE_COLORS[food.role]}`}
          >
            <span className="line-clamp-3">{food.name}</span>
          </div>
        ))}
      </div>
      <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-forge-muted/20 bg-forge-surface" />
    </div>
  );
}
