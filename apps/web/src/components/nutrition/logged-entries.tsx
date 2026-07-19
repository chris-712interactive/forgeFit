"use client";

import { formatLineItemPortion, scaleLineItems } from "@forgefit/nutrition-core";
import {
  isNutritionFavorite,
  loadNutritionFavorites,
  toggleNutritionFavorite,
} from "@/lib/nutrition/favorites";
import { groupEntriesByMeal } from "@/lib/nutrition/meal-types";
import {
  computeMealBudgets,
  getMealBudget,
} from "@/lib/nutrition/meal-budgets";
import { saveCustomFood } from "@/lib/nutrition/custom-foods";
import type { MacroQuickEntry, NutritionLogRow } from "@/lib/nutrition/types";
import type { SavedMeal } from "@/lib/nutrition/saved-meals";
import type { NutritionTargets } from "@forgefit/program-engine";
import { useEffect, useState } from "react";
import { LogMealSheet } from "./log-meal-sheet";

interface LoggedEntriesProps {
  entries: NutritionLogRow[];
  loggedDate: string;
  targets: NutritionTargets | null;
  deletingId: string | null;
  onDelete: (id: string) => void;
  onEdit: (entry: NutritionLogRow) => void;
  embedded?: boolean;
  title?: string;
  emptyMessage?: string;
}

/** Convert a prior log into a temporary meal so LogMealSheet can adjust qty. */
function entryToLoggableMeal(entry: NutritionLogRow): SavedMeal {
  const lineItems = entry.lineItems ?? [];
  const loggedServings = Math.max(
    1,
    Math.round(entry.servingsLogged ?? entry.quantity ?? 1)
  );
  const perUnitItems =
    lineItems.length > 0 && loggedServings > 1
      ? scaleLineItems(lineItems, 1 / loggedServings)
      : lineItems;

  return {
    id: `relog-${entry.id}`,
    name: entry.foodName,
    categoryId: "favorites",
    // Treat previously logged amount as recipe ×1 so adjust starts from that unit.
    lineItems: perUnitItems,
    servings: 1,
    calories: Math.round(entry.calories / loggedServings),
    proteinG: Math.round((entry.proteinG / loggedServings) * 10) / 10,
    carbsG: Math.round((entry.carbsG / loggedServings) * 10) / 10,
    fatG: Math.round((entry.fatG / loggedServings) * 10) / 10,
    createdAt: new Date().toISOString(),
  };
}

export function LoggedEntries({
  entries,
  loggedDate,
  targets,
  deletingId,
  onDelete,
  onEdit,
  embedded = false,
  title = "Logged today",
  emptyMessage = "Nothing logged yet. Tap + to log macros or build a meal.",
}: LoggedEntriesProps) {
  const [favorites, setFavorites] = useState<MacroQuickEntry[]>([]);
  const [savedFoodMessage, setSavedFoodMessage] = useState<string | null>(null);
  const [relogEntry, setRelogEntry] = useState<NutritionLogRow | null>(null);
  const groups = groupEntriesByMeal(entries);
  const mealBudgets = computeMealBudgets(targets);

  useEffect(() => {
    setFavorites(loadNutritionFavorites());
  }, [entries]);

  function handleToggleFavorite(entry: NutritionLogRow) {
    const quickEntry: MacroQuickEntry = {
      foodName: entry.foodName,
      calories: entry.calories,
      proteinG: entry.proteinG,
      carbsG: entry.carbsG,
      fatG: entry.fatG,
    };
    setFavorites(toggleNutritionFavorite(quickEntry));
  }

  function handleSaveAsFood(entry: NutritionLogRow) {
    try {
      saveCustomFood({
        name: entry.foodName,
        servingLabel: entry.servingDescription || "1 serving",
        calories: entry.calories,
        proteinG: entry.proteinG,
        carbsG: entry.carbsG,
        fatG: entry.fatG,
      });
      setSavedFoodMessage(`Saved “${entry.foodName}” to My foods`);
      window.setTimeout(() => setSavedFoodMessage(null), 3000);
    } catch {
      window.alert("Could not save that food. Try again.");
    }
  }

  const relogMeal = relogEntry ? entryToLoggableMeal(relogEntry) : null;
  const relogServings = relogEntry
    ? Math.max(1, Math.round(relogEntry.servingsLogged ?? relogEntry.quantity ?? 1))
    : 1;

  const content = (
    <>
      <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
        {title}
      </h2>
      {savedFoodMessage && (
        <p className="mt-2 text-sm font-medium text-forge-success">{savedFoodMessage}</p>
      )}
      {entries.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-[var(--border)] p-8 text-center">
          <p className="text-forge-muted">{emptyMessage}</p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-5">
          {groups.map((group) => (
            <MealGroupSection
              key={group.mealType ?? "other"}
              label={group.label}
              totals={group.totals}
              budget={getMealBudget(mealBudgets, group.mealType)}
            >
              {group.entries.map((entry) => (
                <LoggedEntryCard
                  key={entry.id}
                  entry={entry}
                  deleting={deletingId === entry.id}
                  pinned={isNutritionFavorite(
                    {
                      foodName: entry.foodName,
                      calories: entry.calories,
                      proteinG: entry.proteinG,
                      carbsG: entry.carbsG,
                      fatG: entry.fatG,
                    },
                    favorites
                  )}
                  onDelete={() => onDelete(entry.id)}
                  onEdit={() => onEdit(entry)}
                  onLogAgain={() => setRelogEntry(entry)}
                  onToggleFavorite={() => handleToggleFavorite(entry)}
                  onSaveAsFood={() => handleSaveAsFood(entry)}
                />
              ))}
            </MealGroupSection>
          ))}
        </div>
      )}

      <LogMealSheet
        open={relogMeal != null}
        meal={relogMeal}
        loggedDate={loggedDate}
        initialServings={relogServings}
        onClose={() => setRelogEntry(null)}
      />
    </>
  );

  if (embedded) return content;

  return (
    <section className="flex flex-col gap-4 sm:gap-5">{content}</section>
  );
}

function MealGroupSection({
  label,
  totals,
  budget,
  children,
}: {
  label: string;
  totals: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  budget: ReturnType<typeof getMealBudget>;
  children: React.ReactNode;
}) {
  const calorieLine =
    budget && budget.calories > 0
      ? `${Math.round(totals.calories)} / ~${budget.calories} kcal`
      : `${Math.round(totals.calories)} kcal`;
  const proteinLine =
    budget && budget.proteinG > 0
      ? `P ${Math.round(totals.proteinG)} / ~${budget.proteinG}g`
      : `P ${Math.round(totals.proteinG)}g`;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="font-display text-sm font-semibold text-forge-text">
          {label}
        </h3>
        <p className="text-xs text-forge-muted">
          {calorieLine} · {proteinLine}
        </p>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function LoggedEntryCard({
  entry,
  deleting,
  pinned,
  onDelete,
  onEdit,
  onLogAgain,
  onToggleFavorite,
  onSaveAsFood,
}: {
  entry: NutritionLogRow;
  deleting: boolean;
  pinned: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onLogAgain: () => void;
  onToggleFavorite: () => void;
  onSaveAsFood: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasBreakdown = (entry.lineItems?.length ?? 0) > 0;

  return (
    <article className="rounded-xl border border-[var(--border)] bg-forge-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold text-forge-text">
            {entry.foodName}
          </p>
          <p className="mt-1 text-sm text-forge-steel">
            {Math.round(entry.calories)} kcal · P {entry.proteinG}g
            {(entry.carbsG > 0 || entry.fatG > 0) && (
              <>
                {" "}
                · C {entry.carbsG}g · F {entry.fatG}g
              </>
            )}
          </p>
          {entry.servingDescription && entry.foodSource === "custom" && (
            <p className="mt-0.5 text-xs text-forge-muted">
              {entry.servingDescription}
            </p>
          )}
          {entry.foodSource !== "custom" && (
            <p className="mt-1 text-sm text-forge-muted">
              {entry.quantity}× {entry.servingDescription}
              {entry.brand ? ` · ${entry.brand}` : ""}
            </p>
          )}
          {hasBreakdown && (
            <button
              type="button"
              onClick={() => setExpanded((open) => !open)}
              className="mt-2 text-xs font-semibold text-forge-ember hover:underline"
            >
              {expanded
                ? "Hide ingredients"
                : `Show ${entry.lineItems!.length} ingredients`}
            </button>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <button
            type="button"
            aria-label={pinned ? "Remove from favorites" : "Add to favorites"}
            onClick={onToggleFavorite}
            className={`rounded-lg p-2 transition-colors hover:bg-forge-surface-raised ${
              pinned ? "text-forge-ember" : "text-forge-muted hover:text-forge-ember"
            }`}
          >
            <PinIcon filled={pinned} />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--border)] pt-3">
        <ActionButton
          label="Log again"
          onClick={onLogAgain}
          variant="primary"
        />
        <ActionButton label="Edit" onClick={onEdit} />
        <ActionButton label="Save food" onClick={onSaveAsFood} />
        <ActionButton
          label={deleting ? "…" : "Remove"}
          disabled={deleting}
          onClick={onDelete}
          variant="danger"
        />
      </div>

      {expanded && hasBreakdown && (
        <ul className="mt-3 space-y-1.5 border-t border-[var(--border)] pt-3">
          {entry.lineItems!.map((item) => (
            <li
              key={item.id}
              className="flex items-baseline justify-between gap-2 text-xs"
            >
              <span className="min-w-0 truncate text-forge-text">
                {item.foodName}
              </span>
              <span className="shrink-0 text-forge-muted">
                {formatLineItemPortion(item.foodId, item.quantity)} ·{" "}
                {item.calories} kcal
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function ActionButton({
  label,
  onClick,
  disabled = false,
  variant = "default",
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "primary" | "danger";
}) {
  const classes =
    variant === "primary"
      ? "bg-forge-surface-raised text-forge-ember hover:bg-forge-ember/10"
      : variant === "danger"
        ? "text-forge-coral hover:bg-forge-coral/10"
        : "text-forge-steel ring-1 ring-[var(--border)] hover:text-forge-text";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50 ${classes}`}
    >
      {label}
    </button>
  );
}

function PinIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="h-4 w-4"
      fill={filled ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
      />
    </svg>
  );
}
