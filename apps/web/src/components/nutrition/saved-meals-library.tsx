"use client";

import {
  formatMacroLine,
  formatServingsLabel,
  getCategoryById,
  getCategoryColor,
  getPerServingTotals,
  loadSavedMealCategories,
  loadSavedMeals,
  mealHasLineItems,
  removeSavedMeal,
  removeSavedMealCategory,
  renameSavedMealCategory,
  type SavedMeal,
  type SavedMealCategory,
} from "@/lib/nutrition/saved-meals";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LogMealSheet } from "./log-meal-sheet";
import { MealBuilder } from "./meal-builder";
import { SaveMealSheet, type SaveMealDraft } from "./save-meal-sheet";

interface SavedMealsLibraryProps {
  loggedDate: string;
  refreshKey?: number;
  onMealsChanged?: () => void;
}

type CategoryFilter = "all" | string;

export function SavedMealsLibrary({
  loggedDate,
  refreshKey = 0,
  onMealsChanged,
}: SavedMealsLibraryProps) {
  const router = useRouter();
  const [meals, setMeals] = useState<SavedMeal[]>([]);
  const [categories, setCategories] = useState<SavedMealCategory[]>([]);
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saveDraft, setSaveDraft] = useState<SaveMealDraft | null>(null);
  const [builderMeal, setBuilderMeal] = useState<SavedMeal | null>(null);
  const [logMeal, setLogMeal] = useState<SavedMeal | null>(null);
  const [managingCategories, setManagingCategories] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const reload = useCallback(() => {
    setMeals(loadSavedMeals());
    setCategories(loadSavedMealCategories());
  }, []);

  useEffect(() => {
    reload();
  }, [reload, refreshKey]);

  const filteredMeals = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return meals.filter((meal) => {
      if (filter !== "all" && meal.categoryId !== filter) return false;
      if (!normalizedQuery) return true;
      const categoryName =
        getCategoryById(meal.categoryId, categories)?.name.toLowerCase() ?? "";
      return (
        meal.name.toLowerCase().includes(normalizedQuery) ||
        categoryName.includes(normalizedQuery)
      );
    });
  }, [meals, filter, query, categories]);

  const groupedMeals = useMemo(() => {
    if (filter !== "all") return [{ categoryId: filter, meals: filteredMeals }];
    const groups = new Map<string, SavedMeal[]>();
    for (const meal of filteredMeals) {
      const list = groups.get(meal.categoryId) ?? [];
      list.push(meal);
      groups.set(meal.categoryId, list);
    }
    return categories
      .map((category) => ({
        categoryId: category.id,
        meals: groups.get(category.id) ?? [],
      }))
      .filter((group) => group.meals.length > 0);
  }, [filteredMeals, filter, categories]);

  function handleSaved() {
    reload();
    onMealsChanged?.();
  }

  function openCreateBuilder() {
    router.push("/nutrition/build-meal");
  }

  function handleEdit(meal: SavedMeal) {
    if (mealHasLineItems(meal)) {
      setBuilderMeal(meal);
    } else {
      setSaveDraft({
        id: meal.id,
        name: meal.name,
        calories: meal.calories,
        proteinG: meal.proteinG,
        carbsG: meal.carbsG,
        fatG: meal.fatG,
        categoryId: meal.categoryId,
      });
    }
  }

  function handleDelete(meal: SavedMeal) {
    if (!window.confirm(`Remove "${meal.name}" from My Meals?`)) return;
    removeSavedMeal(meal.id);
    reload();
    onMealsChanged?.();
  }

  function startRename(category: SavedMealCategory) {
    if (["breakfast", "lunch", "dinner", "snacks", "favorites"].includes(category.id)) {
      return;
    }
    setRenamingId(category.id);
    setRenameValue(category.name);
  }

  function commitRename() {
    if (!renamingId) return;
    renameSavedMealCategory(renamingId, renameValue);
    setRenamingId(null);
    setRenameValue("");
    reload();
  }

  return (
    <>
      <div className="space-y-5">
        <div>
          <h2 className="font-display text-lg font-bold text-forge-text">
            My Meals
          </h2>
          <p className="mt-1 text-sm text-forge-muted">
            Build meals from whole ingredients — adjust portions when logging without changing your saved template.
          </p>
        </div>

        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search meals or categories…"
            className="min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-forge-surface px-4 pl-10 text-base text-forge-text outline-none focus:border-forge-ember"
          />
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-forge-muted" />
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CategoryPill
            label="All"
            count={meals.length}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          {categories.map((category) => {
            const count = meals.filter((meal) => meal.categoryId === category.id).length;
            return (
              <CategoryPill
                key={category.id}
                label={category.name}
                count={count}
                active={filter === category.id}
                onClick={() => setFilter(category.id)}
              />
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={openCreateBuilder}
            className="text-sm font-semibold text-forge-ember hover:text-forge-glow"
          >
            + Build meal
          </button>
          <button
            type="button"
            onClick={() => setManagingCategories((open) => !open)}
            className="text-sm font-medium text-forge-muted hover:text-forge-text"
          >
            {managingCategories ? "Done" : "Manage categories"}
          </button>
        </div>

        {managingCategories && (
          <section className="rounded-2xl border border-[var(--border)] bg-forge-surface p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-forge-muted">
              Your categories
            </h3>
            <ul className="mt-3 space-y-2">
              {categories.map((category) => {
                const isDefault = [
                  "breakfast",
                  "lunch",
                  "dinner",
                  "snacks",
                  "favorites",
                ].includes(category.id);
                const mealCount = meals.filter(
                  (meal) => meal.categoryId === category.id
                ).length;

                return (
                  <li
                    key={category.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-forge-surface-raised px-3 py-2.5"
                  >
                    {renamingId === category.id ? (
                      <input
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename();
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                        className="min-h-[36px] flex-1 rounded-lg border border-[var(--border)] bg-forge-surface px-2 text-sm text-forge-text outline-none focus:border-forge-ember"
                        autoFocus
                      />
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-forge-text">
                          {category.name}
                        </p>
                        <p className="text-xs text-forge-muted">
                          {mealCount} {mealCount === 1 ? "meal" : "meals"}
                          {isDefault ? " · Default" : ""}
                        </p>
                      </div>
                    )}
                    {!isDefault && renamingId !== category.id && (
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => startRename(category)}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-forge-steel hover:text-forge-ember"
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete "${category.name}"? Meals move to Other.`
                              )
                            ) {
                              removeSavedMealCategory(category.id);
                              reload();
                            }
                          }}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-forge-coral"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {meals.length === 0 ? (
          <EmptyLibrary onCreate={openCreateBuilder} />
        ) : filteredMeals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center">
            <p className="text-forge-muted">No meals match your search.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedMeals.map((group) => {
              const category = getCategoryById(group.categoryId, categories);
              if (!category) return null;

              return (
                <section key={group.categoryId}>
                  {filter === "all" && (
                    <h3
                      className={`mb-3 text-xs font-semibold uppercase tracking-wider ${getCategoryColor(group.categoryId, categories)}`}
                    >
                      {category.name}
                    </h3>
                  )}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {group.meals.map((meal) => (
                      <MealCard
                        key={meal.id}
                        meal={meal}
                        category={category}
                        categoryColor={getCategoryColor(meal.categoryId, categories)}
                        onLog={() => setLogMeal(meal)}
                        onEdit={() => handleEdit(meal)}
                        onDelete={() => handleDelete(meal)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {error && <p className="text-sm text-forge-coral">{error}</p>}
      </div>

      <SaveMealSheet
        open={saveDraft != null}
        draft={saveDraft}
        onClose={() => setSaveDraft(null)}
        onSaved={handleSaved}
      />

      <MealBuilder
        open={builderMeal != null}
        initialMeal={builderMeal ?? undefined}
        loggedDate={loggedDate}
        onClose={() => setBuilderMeal(null)}
        onSaved={handleSaved}
      />

      <LogMealSheet
        open={logMeal != null}
        meal={logMeal}
        loggedDate={loggedDate}
        onClose={() => setLogMeal(null)}
      />
    </>
  );
}

function MealCard({
  meal,
  category,
  categoryColor,
  onLog,
  onEdit,
  onDelete,
}: {
  meal: SavedMeal;
  category: SavedMealCategory;
  categoryColor: string;
  onLog: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-forge-surface p-4 transition-colors hover:border-forge-ember/30">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-forge-ember/60 via-forge-gold/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${categoryColor}`}>
            {category.name}
          </span>
          <h4 className="mt-1 truncate font-display text-base font-semibold text-forge-text">
            {meal.name}
          </h4>
          <p className="mt-1.5 text-sm text-forge-muted">
            {formatMacroLine(
              meal.lineItems.length > 0 ? getPerServingTotals(meal) : meal
            )}
            {meal.servings > 1 && meal.lineItems.length > 0 && (
              <span className="text-forge-steel"> / serving</span>
            )}
          </p>
          {meal.lineItems.length > 0 && (
            <p className="mt-1 text-xs text-forge-steel">
              {meal.lineItems.length} ingredients
              {meal.servings > 1
                ? ` · recipe: ${formatServingsLabel(meal.servings)}`
                : ""}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-0.5">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${meal.name}`}
            className="rounded-lg p-2 text-forge-muted hover:text-forge-text"
          >
            <EditIcon />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${meal.name}`}
            className="rounded-lg p-2 text-forge-muted hover:text-forge-coral"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onLog}
        className="mt-4 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-forge-ember/10 font-display text-sm font-bold text-forge-ember transition-colors hover:bg-forge-ember hover:text-white"
      >
        + Log today
      </button>
    </article>
  );
}

function CategoryPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-forge-ember text-white"
          : "border border-[var(--border)] bg-forge-surface text-forge-text hover:border-forge-ember/40"
      }`}
    >
      {label}
      {count > 0 && (
        <span className={`ml-1.5 text-xs ${active ? "text-white/80" : "text-forge-muted"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function EmptyLibrary({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-forge-ember/30 bg-forge-surface/50 px-6 py-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-forge-ember/10">
        <BookmarkIcon className="text-forge-ember" />
      </div>
      <h3 className="mt-4 font-display text-lg font-bold text-forge-text">
        Build your meal library
      </h3>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-forge-muted">
        Build meals from whole ingredients like eggs, chicken, and rice. Each saved meal keeps its ingredient list — tweak portions when logging without changing the template.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-forge-ember px-5 font-display text-sm font-bold text-white"
      >
        Build your first meal
      </button>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={`h-4 w-4 ${className ?? ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg className={`h-7 w-7 ${className ?? ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}
