"use client";

import {
  buildLineItem,
  formatLineItemPortion,
  rescaleLineItem,
  searchWholeFoods,
  sumLineItems,
  WHOLE_FOOD_GROUPS,
  WHOLE_FOOD_GROUP_LABELS,
  type MealLineItem,
  type WholeFood,
  type WholeFoodGroup,
} from "@forgefit/nutrition-core";
import {
  createCategoryId,
  getCategoryById,
  loadSavedMealCategories,
  saveSavedMeal,
  saveSavedMealCategory,
  type SavedMeal,
  type SavedMealCategory,
} from "@/lib/nutrition/saved-meals";
import { postMacroLogEntry } from "@/lib/nutrition/log-entry";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MealQuantityStepper } from "./meal-quantity-stepper";
import { IngredientSuggestionPanel } from "./ingredient-suggestion-panel";

interface MealBuilderProps {
  open: boolean;
  loggedDate: string;
  initialMeal?: SavedMeal | null;
  onClose: () => void;
  onSaved?: (meal: SavedMeal) => void;
}

type BuilderStep = 1 | 2 | 3;

const STEPS: { step: BuilderStep; label: string; title: string; hint: string }[] = [
  {
    step: 1,
    label: "Name",
    title: "Name your meal",
    hint: "Something you'll recognize later — e.g. Usual breakfast or Post-workout bowl.",
  },
  {
    step: 2,
    label: "Ingredients",
    title: "Add ingredients",
    hint: "Search and tap to add. Use +/− to adjust how much of each portion.",
  },
  {
    step: 3,
    label: "Save",
    title: "Category & save",
    hint: "Pick where this lives in My Meals, then save or log it for today.",
  },
];

const inputClass =
  "min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-forge-surface px-4 text-base text-forge-text outline-none focus:border-forge-ember";

const GROUPS = WHOLE_FOOD_GROUPS;

export function MealBuilder({
  open,
  loggedDate,
  initialMeal,
  onClose,
  onSaved,
}: MealBuilderProps) {
  const router = useRouter();
  const [step, setStep] = useState<BuilderStep>(1);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("favorites");
  const [categories, setCategories] = useState<SavedMealCategory[]>([]);
  const [lineItems, setLineItems] = useState<MealLineItem[]>([]);
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<WholeFoodGroup | "all">("all");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const currentStep = STEPS[step - 1]!;

  useEffect(() => {
    if (!open) return;
    setCategories(loadSavedMealCategories());
    setStep(1);
    if (initialMeal) {
      setName(initialMeal.name);
      setCategoryId(initialMeal.categoryId);
      setLineItems(initialMeal.lineItems.map((item) => ({ ...item })));
    } else {
      setName("");
      setCategoryId("favorites");
      setLineItems([]);
    }
    setQuery("");
    setGroupFilter("all");
    setShowNewCategory(false);
    setNewCategoryName("");
    setError(null);
  }, [open, initialMeal]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const foods = useMemo(
    () =>
      searchWholeFoods(
        query,
        groupFilter === "all" ? undefined : groupFilter
      ).slice(0, 24),
    [query, groupFilter]
  );

  const totals = useMemo(() => sumLineItems(lineItems), [lineItems]);
  const selectedCategory = getCategoryById(categoryId, categories);

  if (!open) return null;

  function addFood(food: WholeFood) {
    setError(null);
    const existing = lineItems.find((item) => item.foodId === food.id);
    if (existing) {
      setLineItems((items) =>
        items.map((item) =>
          item.id === existing.id
            ? rescaleLineItem(item, item.quantity + 1)
            : item
        )
      );
      return;
    }
    setLineItems((items) => [...items, buildLineItem(food, 1)]);
  }

  function updateQuantity(id: string, quantity: number) {
    if (quantity <= 0) {
      setLineItems((items) => items.filter((item) => item.id !== id));
      return;
    }
    setLineItems((items) =>
      items.map((item) =>
        item.id === id ? rescaleLineItem(item, quantity) : item
      )
    );
  }

  function handleAddCategory() {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    const existing = categories.find(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      setCategoryId(existing.id);
    } else {
      const category = { id: createCategoryId(trimmed), name: trimmed };
      saveSavedMealCategory(category);
      setCategories(loadSavedMealCategories());
      setCategoryId(category.id);
    }
    setShowNewCategory(false);
    setNewCategoryName("");
  }

  function goNext() {
    setError(null);
    if (step === 1) {
      if (!name.trim()) {
        setError("Enter a meal name to continue.");
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (lineItems.length === 0) {
        setError("Add at least one ingredient to continue.");
        return;
      }
      setStep(3);
    }
  }

  function goBack() {
    setError(null);
    if (step === 1) {
      onClose();
      return;
    }
    setStep((s) => (s - 1) as BuilderStep);
  }

  async function handleSave(andLog: boolean) {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Enter a meal name.");
      setStep(1);
      return;
    }
    if (lineItems.length === 0) {
      setError("Add at least one ingredient.");
      setStep(2);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const meal = saveSavedMeal({
        id: initialMeal?.id,
        name: trimmedName,
        categoryId,
        lineItems,
        ...totals,
      });
      onSaved?.(meal);

      if (andLog) {
        await postMacroLogEntry({
          foodName: trimmedName,
          calories: totals.calories,
          proteinG: totals.proteinG,
          carbsG: totals.carbsG,
          fatG: totals.fatG,
          loggedDate,
        });
        router.refresh();
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save meal.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-forge-surface"
      role="dialog"
      aria-modal="true"
      aria-label="Build meal"
    >
      <header className="shrink-0 border-b border-[var(--border)] bg-forge-surface-raised px-4 py-3">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              className="text-sm font-medium text-forge-muted hover:text-forge-text"
            >
              {step === 1 ? "Cancel" : "Back"}
            </button>
            <h2 className="font-display text-base font-bold text-forge-text">
              {initialMeal ? "Edit meal" : "Build meal"}
            </h2>
            <span className="w-14 text-right text-xs font-semibold text-forge-muted">
              {step}/3
            </span>
          </div>

          <div className="mt-3 flex gap-1">
            {STEPS.map(({ step: s, label }) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-forge-ember" : "bg-forge-surface"
                }`}
                aria-hidden
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] font-semibold uppercase tracking-wider text-forge-muted">
            {STEPS.map(({ step: s, label }) => (
              <span
                key={s}
                className={s === step ? "text-forge-ember" : undefined}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden px-4 py-4">
          <StepHeader
            step={step}
            title={currentStep.title}
            hint={currentStep.hint}
            mealName={name.trim() || undefined}
          />

          {step === 1 && (
            <StepName name={name} onNameChange={setName} onContinue={goNext} />
          )}

          {step === 2 && (
            <StepIngredients
              mealName={name.trim()}
              lineItems={lineItems}
              totals={totals}
              query={query}
              groupFilter={groupFilter}
              foods={foods}
              onQueryChange={setQuery}
              onGroupFilterChange={setGroupFilter}
              onAddFood={addFood}
              onUpdateQuantity={updateQuantity}
            />
          )}

          {step === 3 && (
            <StepSave
              name={name.trim()}
              lineItems={lineItems}
              totals={totals}
              categories={categories}
              categoryId={categoryId}
              selectedCategory={selectedCategory}
              showNewCategory={showNewCategory}
              newCategoryName={newCategoryName}
              onCategoryChange={setCategoryId}
              onToggleNewCategory={() => setShowNewCategory((v) => !v)}
              onNewCategoryNameChange={setNewCategoryName}
              onAddCategory={handleAddCategory}
            />
          )}

          {error && (
            <p className="mt-3 shrink-0 text-sm text-forge-coral" role="alert">
              {error}
            </p>
          )}
        </div>

        <footer className="shrink-0 border-t border-[var(--border)] bg-forge-surface-raised p-4">
          {step < 3 ? (
            <button
              type="button"
              onClick={goNext}
              className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-forge-ember font-display text-sm font-bold text-white"
            >
              Continue
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleSave(true)}
                className="flex min-h-[52px] items-center justify-center rounded-xl bg-forge-ember font-display text-sm font-bold text-white disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Save & log today"}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleSave(false)}
                className="flex min-h-[44px] items-center justify-center rounded-xl border border-[var(--border)] text-sm font-semibold text-forge-text disabled:opacity-50"
              >
                Save to My Meals
              </button>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}

function StepHeader({
  step,
  title,
  hint,
  mealName,
}: {
  step: BuilderStep;
  title: string;
  hint: string;
  mealName?: string;
}) {
  return (
    <div className="shrink-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-forge-gold">
        Step {step} of 3
      </p>
      <h3 className="mt-1 font-display text-xl font-bold text-forge-text">
        {title}
      </h3>
      <p className="mt-1 text-sm text-forge-muted">{hint}</p>
      {mealName && step > 1 && (
        <p className="mt-3 inline-flex rounded-full border border-forge-ember/30 bg-forge-ember/10 px-3 py-1 text-sm font-medium text-forge-ember">
          {mealName}
        </p>
      )}
    </div>
  );
}

function StepName({
  name,
  onNameChange,
  onContinue,
}: {
  name: string;
  onNameChange: (value: string) => void;
  onContinue: () => void;
}) {
  return (
    <div className="mt-6 flex flex-1 flex-col">
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-forge-muted">
          Meal name
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onContinue()}
          placeholder="e.g. Usual breakfast"
          className={inputClass}
          autoFocus
        />
      </label>
      <div className="mt-4 flex flex-wrap gap-2">
        {["Usual breakfast", "Work lunch", "Post-workout", "Evening snack"].map(
          (suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onNameChange(suggestion)}
              className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-forge-muted hover:border-forge-ember/40 hover:text-forge-text"
            >
              {suggestion}
            </button>
          )
        )}
      </div>
    </div>
  );
}

function StepIngredients({
  mealName,
  lineItems,
  totals,
  query,
  groupFilter,
  foods,
  onQueryChange,
  onGroupFilterChange,
  onAddFood,
  onUpdateQuantity,
}: {
  mealName: string;
  lineItems: MealLineItem[];
  totals: ReturnType<typeof sumLineItems>;
  query: string;
  groupFilter: WholeFoodGroup | "all";
  foods: WholeFood[];
  onQueryChange: (value: string) => void;
  onGroupFilterChange: (value: WholeFoodGroup | "all") => void;
  onAddFood: (food: WholeFood) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
}) {
  return (
    <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3">
      {lineItems.length > 0 && (
        <div className="shrink-0 rounded-xl border border-forge-ember/25 bg-forge-ember/5 px-3 py-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-semibold text-forge-muted">
              {lineItems.length} ingredient{lineItems.length === 1 ? "" : "s"}
            </span>
            <span className="text-sm font-semibold text-forge-text">
              {totals.calories} kcal · {totals.proteinG}g P
            </span>
          </div>
        </div>
      )}

      {lineItems.length > 0 && (
        <ul className="max-h-[140px] shrink-0 space-y-1.5 overflow-y-auto">
          {lineItems.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-[var(--border)] bg-forge-surface-raised px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-forge-text">
                    {item.foodName}
                  </p>
                  <p className="text-xs text-forge-muted">
                    {formatLineItemPortion(item.foodId, item.quantity)} ·{" "}
                    {item.calories} kcal
                  </p>
                </div>
                <MealQuantityStepper
                  foodId={item.foodId}
                  value={item.quantity}
                  onChange={(q) => onUpdateQuantity(item.id, q)}
                  compact
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-[var(--border)] bg-forge-surface-raised p-3">
        <p className="shrink-0 text-xs font-semibold uppercase tracking-wider text-forge-muted">
          Search ingredients
        </p>
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search sugar, chicken, garlic, flour…"
          className={`${inputClass} mt-2 shrink-0 text-sm`}
        />
        <div className="-mx-1 mt-2 flex shrink-0 gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <FilterChip
            label="All"
            active={groupFilter === "all"}
            onClick={() => onGroupFilterChange("all")}
          />
          {GROUPS.map((group) => (
            <FilterChip
              key={group}
              label={WHOLE_FOOD_GROUP_LABELS[group]}
              active={groupFilter === group}
              onClick={() => onGroupFilterChange(group)}
            />
          ))}
        </div>

        <ul className="mt-2 min-h-0 flex-1 space-y-1.5 overflow-y-auto">
          {foods.map((food) => (
            <li key={food.id}>
              <button
                type="button"
                onClick={() => onAddFood(food)}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-forge-surface px-3 py-2.5 text-left transition-colors hover:border-forge-ember/40"
              >
                <div className="min-w-0">
                  <span className="block text-sm font-medium text-forge-text">
                    {food.name}
                  </span>
                  <span className="block text-xs text-forge-muted">
                    {food.servingLabel}
                  </span>
                </div>
                <span className="shrink-0 text-xs font-semibold text-forge-ember">
                  {food.macros.calories} kcal
                </span>
              </button>
            </li>
          ))}
          {foods.length === 0 && query.trim().length >= 2 && (
            <IngredientSuggestionPanel
              key={query.trim().toLowerCase()}
              searchQuery={query.trim()}
              inputClass={inputClass}
            />
          )}
          {foods.length === 0 &&
            query.trim().length > 0 &&
            query.trim().length < 2 && (
            <li className="py-4 text-center text-sm text-forge-muted">
              Keep typing to search, or try another term.
            </li>
          )}
        </ul>
      </div>

      {lineItems.length === 0 && (
        <p className="shrink-0 text-center text-xs text-forge-muted">
          Tap ingredients above to build &ldquo;{mealName}&rdquo;
        </p>
      )}
    </div>
  );
}

function StepSave({
  name,
  lineItems,
  totals,
  categories,
  categoryId,
  selectedCategory,
  showNewCategory,
  newCategoryName,
  onCategoryChange,
  onToggleNewCategory,
  onNewCategoryNameChange,
  onAddCategory,
}: {
  name: string;
  lineItems: MealLineItem[];
  totals: ReturnType<typeof sumLineItems>;
  categories: SavedMealCategory[];
  categoryId: string;
  selectedCategory: SavedMealCategory | null;
  showNewCategory: boolean;
  newCategoryName: string;
  onCategoryChange: (id: string) => void;
  onToggleNewCategory: () => void;
  onNewCategoryNameChange: (value: string) => void;
  onAddCategory: () => void;
}) {
  return (
    <div className="mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      <section className="rounded-xl border border-[var(--border)] bg-forge-surface-raised p-4">
        <h4 className="font-display text-lg font-bold text-forge-text">{name}</h4>
        <p className="mt-1 text-sm text-forge-muted">
          {totals.calories} kcal · {totals.proteinG}g P · {totals.carbsG}g C ·{" "}
          {totals.fatG}g F
        </p>
        <ul className="mt-3 space-y-1 border-t border-[var(--border)] pt-3">
          {lineItems.map((item) => (
            <li
              key={item.id}
              className="flex justify-between gap-2 text-sm text-forge-muted"
            >
              <span className="truncate text-forge-text">
                {item.foodName}
                <span className="text-forge-muted">
                  {" "}
                  · {formatLineItemPortion(item.foodId, item.quantity)}
                </span>
              </span>
              <span className="shrink-0 tabular-nums">{item.calories} kcal</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-forge-muted">
          Category
        </span>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => onCategoryChange(category.id)}
              className={`rounded-full px-3.5 py-2 text-sm font-medium ${
                categoryId === category.id
                  ? "bg-forge-ember text-white"
                  : "border border-[var(--border)] text-forge-text"
              }`}
            >
              {category.name}
            </button>
          ))}
          <button
            type="button"
            onClick={onToggleNewCategory}
            className="rounded-full border border-dashed border-[var(--border)] px-3.5 py-2 text-sm text-forge-steel"
          >
            + New
          </button>
        </div>
        {showNewCategory && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => onNewCategoryNameChange(e.target.value)}
              placeholder="Category name"
              className={inputClass}
              onKeyDown={(e) => e.key === "Enter" && onAddCategory()}
            />
            <button
              type="button"
              onClick={onAddCategory}
              className="shrink-0 rounded-xl px-4 text-sm font-semibold text-forge-ember"
            >
              Add
            </button>
          </div>
        )}
        {selectedCategory && (
          <p className="mt-2 text-xs text-forge-muted">
            Saves to <span className="text-forge-text">{selectedCategory.name}</span>
          </p>
        )}
      </section>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
        active
          ? "bg-forge-ember text-white"
          : "border border-[var(--border)] text-forge-muted"
      }`}
    >
      {label}
    </button>
  );
}
