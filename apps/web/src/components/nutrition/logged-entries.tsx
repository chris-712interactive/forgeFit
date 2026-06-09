"use client";

import type { NutritionLogRow } from "@/lib/nutrition/types";

interface LoggedEntriesProps {
  entries: NutritionLogRow[];
  deletingId: string | null;
  onDelete: (id: string) => void;
}

export function LoggedEntries({
  entries,
  deletingId,
  onDelete,
}: LoggedEntriesProps) {
  return (
    <section className="flex flex-col gap-4 sm:gap-5">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
        Logged today
      </h2>
      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center">
          <p className="text-forge-muted">
            Log a quick entry or tap a preset to start closing your macro gap.
          </p>
        </div>
      ) : (
        entries.map((entry) => (
          <article
            key={entry.id}
            className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4"
          >
            <div className="min-w-0">
              <p className="font-display font-semibold text-forge-text">
                {entry.foodName}
              </p>
              {entry.foodSource !== "custom" && (
                <p className="mt-1 text-sm text-forge-muted">
                  {entry.quantity}× {entry.servingDescription}
                  {entry.brand ? ` · ${entry.brand}` : ""}
                </p>
              )}
              <p className="mt-1 text-sm text-forge-steel">
                {Math.round(entry.calories)} kcal · P {entry.proteinG}g
                {(entry.carbsG > 0 || entry.fatG > 0) && (
                  <>
                    {" "}
                    · C {entry.carbsG}g · F {entry.fatG}g
                  </>
                )}
              </p>
            </div>
            <button
              type="button"
              disabled={deletingId === entry.id}
              onClick={() => onDelete(entry.id)}
              className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-forge-coral disabled:opacity-50"
            >
              {deletingId === entry.id ? "…" : "Remove"}
            </button>
          </article>
        ))
      )}
    </section>
  );
}
