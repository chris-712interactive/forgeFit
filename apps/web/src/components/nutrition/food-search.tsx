"use client";

import {
  scaleMacrosFrom100g,
  type FoodSearchResult,
} from "@forgefit/nutrition-core";
import { useEffect, useState } from "react";

interface FoodSearchProps {
  onAdd: (food: FoodSearchResult, quantity: number, servingGrams: number) => Promise<void>;
  adding: boolean;
  /** Omit card chrome when nested inside FoodSearchPanel */
  embedded?: boolean;
  /** Search Open Food Facts only (packaged food mode) */
  offOnly?: boolean;
}

export function FoodSearch({ onAdd, adding, embedded = false, offOnly = false }: FoodSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usdaEnabled, setUsdaEnabled] = useState(true);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void fetch(
        `/api/nutrition/search?q=${encodeURIComponent(query.trim())}${
          offOnly ? "&source=off" : ""
        }`,
        {
        signal: controller.signal,
      }
      )
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("Search failed");
          }
          return response.json() as Promise<{
            results: FoodSearchResult[];
            sources?: { usda?: boolean };
          }>;
        })
        .then((data) => {
          setResults(data.results);
          setUsdaEnabled(data.sources?.usda ?? false);
        })
        .catch((err) => {
          if (err instanceof Error && err.name === "AbortError") return;
          setError("Could not search foods. Try again.");
          setResults([]);
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, offOnly]);

  const content = (
    <>
      {!embedded && (
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
          Add food
        </h2>
      )}
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={
          offOnly ? "Search yogurt, protein bar, cereal…" : "Search chicken, oats, yogurt…"
        }
        className={`${embedded ? "" : "mt-3 "}min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-forge-surface px-4 text-base text-forge-text outline-none focus:border-forge-ember`}
      />
      {(offOnly || !usdaEnabled) && query.length >= 2 && (
        <p className="mt-2 text-xs text-forge-muted">
          {offOnly
            ? "Searching Open Food Facts for packaged products."
            : "Searching Open Food Facts. Add USDA_FDC_API_KEY for branded US foods."}
        </p>
      )}
      {loading && <p className="mt-3 text-sm text-forge-steel">Searching…</p>}
      {error && <p className="mt-3 text-sm text-forge-coral">{error}</p>}

      <ul className="mt-4 flex flex-col gap-3">
        {results.map((food) => {
          const preview = scaleMacrosFrom100g(food.per100g, 100);
          return (
            <li key={`${food.source}-${food.id}`}>
              <button
                type="button"
                disabled={adding}
                onClick={() => void onAdd(food, 1, 100)}
                className="flex w-full items-start justify-between gap-3 rounded-xl border border-[var(--border)] bg-forge-surface px-3 py-3 text-left disabled:opacity-50"
              >
                <div className="min-w-0">
                  <p className="font-medium text-forge-text">{food.name}</p>
                  <p className="mt-0.5 text-xs text-forge-muted">
                    {food.brand ? `${food.brand} · ` : ""}
                    {food.source === "usda" ? "USDA" : "Open Food Facts"} · per 100g
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-forge-ember">
                  {preview.calories} kcal
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
      {content}
    </section>
  );
}
