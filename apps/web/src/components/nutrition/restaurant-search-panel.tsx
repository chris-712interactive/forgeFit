"use client";

import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import { MealTypePicker } from "@/components/nutrition/meal-type-picker";
import { postMacroLogEntry } from "@/lib/nutrition/log-entry";
import { getPreferredMealType, type MealType } from "@/lib/nutrition/meal-types";
import {
  listRestaurantChains,
  searchRestaurantMenu,
  type RestaurantSearchHit,
} from "@/lib/nutrition/restaurant-chains";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { SaveMealDraft } from "./save-meal-sheet";

interface RestaurantSearchPanelProps {
  loggedDate: string;
  unlocked: boolean;
  onSaveMeal?: (draft: SaveMealDraft) => void;
}

export function RestaurantSearchPanel({
  loggedDate,
  unlocked,
  onSaveMeal,
}: RestaurantSearchPanelProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveAfterLog, setSaveAfterLog] = useState(true);
  const [mealType, setMealType] = useState<MealType>(() => getPreferredMealType());

  const results = useMemo(
    () => (unlocked ? searchRestaurantMenu(query) : []),
    [query, unlocked]
  );

  const chains = useMemo(() => listRestaurantChains(), []);

  async function logItem(hit: RestaurantSearchHit, saveMeal: boolean) {
    const label = `${hit.chain.name} · ${hit.item.name}`;
    setLoggingId(hit.item.id);
    setError(null);

    try {
      await postMacroLogEntry({
        foodName: label,
        calories: hit.item.calories,
        proteinG: hit.item.proteinG,
        carbsG: hit.item.carbsG,
        fatG: hit.item.fatG,
        loggedDate,
        mealType,
      });

      if (saveMeal) {
        onSaveMeal?.({
          name: label,
          calories: hit.item.calories,
          proteinG: hit.item.proteinG,
          carbsG: hit.item.carbsG,
          fatG: hit.item.fatG,
          categoryId: "favorites",
        });
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log meal.");
    } finally {
      setLoggingId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-sm font-semibold text-forge-text">
            Eating out
          </h2>
          <p className="mt-1 text-xs text-forge-muted">
            Quick-log popular chain meals and save them to My meals. Full menu
            API search is planned — macros here are approximate.
          </p>
        </div>
        {unlocked && (
          <span className="rounded-full bg-forge-gold/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-forge-gold">
            Pro+
          </span>
        )}
      </div>

      {!unlocked ? (
        <div className="mt-4">
          <UpgradePrompt
            title="Restaurant quick-log"
            description="Log Chipotle, Chick-fil-A, Starbucks, and other chains in one tap — and save your usual orders as meals."
            suggestedTier="pro_plus"
            compact
          />
        </div>
      ) : (
        <>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chains — chipotle, starbucks, chick-fil-a…"
            className="mt-4 min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-forge-surface px-4 text-base text-forge-text outline-none focus:border-forge-ember"
          />

          <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-forge-muted">
            <input
              type="checkbox"
              checked={saveAfterLog}
              onChange={(e) => setSaveAfterLog(e.target.checked)}
              className="size-4 rounded border-[var(--border)]"
            />
            Save logged meals to My Meals (pick a category)
          </label>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-semibold text-forge-muted">
              Log to meal
            </span>
            <MealTypePicker value={mealType} onChange={setMealType} compact />
          </label>

          {query.trim().length >= 2 && results.length === 0 && (
            <p className="mt-3 text-sm text-forge-muted">
              No matches. Try a chain name or use Quick log below for custom
              macros.
            </p>
          )}

          {results.length > 0 && (
            <ul className="mt-4 flex flex-col gap-3">
              {results.map((hit) => (
                <li key={hit.item.id}>
                  <button
                    type="button"
                    disabled={loggingId != null}
                    onClick={() => void logItem(hit, saveAfterLog)}
                    className="flex w-full items-start justify-between gap-3 rounded-xl border border-[var(--border)] bg-forge-surface px-3 py-3 text-left disabled:opacity-50"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-forge-text">
                        {hit.chain.name} · {hit.item.name}
                      </p>
                      <p className="mt-0.5 text-xs text-forge-muted">
                        {hit.item.servingDescription} · approx.
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-forge-ember">
                      {hit.item.calories} kcal
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 border-t border-[var(--border)] pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-forge-muted">
              Official nutrition pages
            </h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {chains.map((chain) => (
                <li key={chain.id}>
                  <a
                    href={chain.nutritionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-forge-steel transition-colors hover:border-forge-ember/40"
                  >
                    {chain.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {error && <p className="mt-3 text-sm text-forge-coral">{error}</p>}
        </>
      )}
    </section>
  );
}
