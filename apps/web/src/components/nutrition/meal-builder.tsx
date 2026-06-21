"use client";

import {
  buildLineItem,
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

interface MealBuilderProps {
  open: boolean;
  loggedDate: string;
  /** When editing an existing saved meal */
  initialMeal?: SavedMeal | null;
  onClose: () => void;
  onSaved?: (meal: SavedMeal) => void;
}

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

  useEffect(() => {
    if (!open) return;
    setCategories(loadSavedMealCategories());
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
      ).slice(0, 32),
    [query, groupFilter]
  );

  const totals = useMemo(() => sumLineItems(lineItems), [lineItems]);

  if (!open) return null;

  function addFood(food: WholeFood) {
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

  async function handleSave(andLog: boolean) {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name your meal.");
      return;
    }
    if (lineItems.length === 0) {
      setError("Add at least one ingredient.");
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

  const selectedCategory = getCategoryById(categoryId, categories);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-forge-surface"
      role="dialog"
      aria-modal="true"
      aria-label="Build meal"
    >
      <header className="shrink-0 border-b border-[var(--border)] bg-forge-surface-raised px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-forge-muted hover:text-forge-text"
          >
            Cancel
          </button>
          <h2 className="font-display text-base font-bold text-forge-text">
            {initialMeal ? "Edit meal" : "Build meal"}
          </h2>
          <div className="w-14" />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Totals bar */}
          {lineItems.length > 0 && (
            <div className="mb-4 rounded-2xl border border-forge-ember/25 bg-forge-ember/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-forge-muted">
                Meal total
              </p>
              <p className="mt-1 font-display text-xl font-bold text-forge-text">
                {totals.calories} kcal
              </p>
              <p className="mt-0.5 text-sm text-forge-muted">
                {totals.proteinG}g P · {totals.carbsG}g C · {totals.fatG}g F
              </p>
            </div>
          )}

          {/* Line items */}
          {lineItems.length > 0 && (
            <section className="mb-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-forge-muted">
                Ingredients ({lineItems.length})
              </h3>
              <ul className="mt-2 space-y-2">
                {lineItems.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-[var(--border)] bg-forge-surface-raised p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-forge-text">
                          {item.foodName}
                        </p>
                        <p className="text-xs text-forge-muted">
                          {item.servingLabel} · {item.calories} kcal
                        </p>
                      </div>
                      <QuantityStepper
                        value={item.quantity}
                        onChange={(q) => updateQuantity(item.id, q)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Food picker */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-forge-muted">
              Add ingredients
            </h3>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search eggs, mayo, bagel, rotisserie chicken…"
              className={`${inputClass} mt-2`}
            />
            <div className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <FilterChip
                label="All"
                active={groupFilter === "all"}
                onClick={() => setGroupFilter("all")}
              />
              {GROUPS.map((group) => (
                <FilterChip
                  key={group}
                  label={WHOLE_FOOD_GROUP_LABELS[group]}
                  active={groupFilter === group}
                  onClick={() => setGroupFilter(group)}
                />
              ))}
            </div>
            <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {foods.map((food) => (
                <li key={food.id}>
                  <button
                    type="button"
                    onClick={() => addFood(food)}
                    className="flex w-full flex-col rounded-xl border border-[var(--border)] bg-forge-surface px-3 py-2.5 text-left transition-colors hover:border-forge-ember/40"
                  >
                    <span className="font-medium text-sm text-forge-text">
                      {food.name}
                    </span>
                    <span className="mt-0.5 text-xs text-forge-muted">
                      {food.servingLabel} · {food.macros.calories} kcal
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {foods.length === 0 && query.trim().length > 0 && (
              <p className="mt-3 text-sm text-forge-muted">
                No matches — try a shorter term or pick a category above.
              </p>
            )}
            {!query.trim() && groupFilter === "all" && (
              <p className="mt-3 text-xs text-forge-muted">
                Tip: search &quot;mayo&quot;, &quot;wrap&quot;, or &quot;sandwich&quot; for shortcuts.
              </p>
            )}
          </section>

          {/* Name + category */}
          <section className="mt-6 space-y-4 border-t border-[var(--border)] pt-5">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-forge-muted">
                Meal name
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Usual breakfast"
                className={inputClass}
              />
            </label>

            <div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-forge-muted">
                Category
              </span>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setCategoryId(category.id)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium ${
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
                  onClick={() => setShowNewCategory((v) => !v)}
                  className="rounded-full border border-dashed border-[var(--border)] px-3 py-1.5 text-sm text-forge-steel"
                >
                  + New
                </button>
              </div>
              {showNewCategory && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name"
                    className={inputClass}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="shrink-0 rounded-xl px-4 text-sm font-semibold text-forge-ember"
                  >
                    Add
                  </button>
                </div>
              )}
              {selectedCategory && (
                <p className="mt-1.5 text-xs text-forge-muted">
                  Saves to {selectedCategory.name}
                </p>
              )}
            </div>
          </section>

          {error && (
            <p className="mt-4 text-sm text-forge-coral" role="alert">
              {error}
            </p>
          )}
        </div>

        <footer className="shrink-0 border-t border-[var(--border)] bg-forge-surface-raised p-4">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={submitting || lineItems.length === 0}
              onClick={() => void handleSave(true)}
              className="flex min-h-[52px] items-center justify-center rounded-xl bg-forge-ember font-display text-sm font-bold text-white disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save & log today"}
            </button>
            <button
              type="button"
              disabled={submitting || lineItems.length === 0}
              onClick={() => void handleSave(false)}
              className="flex min-h-[44px] items-center justify-center rounded-xl border border-[var(--border)] text-sm font-semibold text-forge-text disabled:opacity-50"
            >
              Save to My Meals
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function QuantityStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-lg border border-[var(--border)] bg-forge-surface">
      <button
        type="button"
        onClick={() => onChange(Math.round((value - 0.5) * 10) / 10)}
        className="flex h-9 w-9 items-center justify-center text-lg text-forge-muted hover:text-forge-text"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums text-forge-text">
        {Number.isInteger(value) ? value : value.toFixed(1)}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.round((value + 0.5) * 10) / 10)}
        className="flex h-9 w-9 items-center justify-center text-lg text-forge-muted hover:text-forge-text"
        aria-label="Increase quantity"
      >
        +
      </button>
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
