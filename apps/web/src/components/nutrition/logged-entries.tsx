"use client";

import { formatLineItemPortion } from "@forgefit/nutrition-core";
import type { NutritionLogRow } from "@/lib/nutrition/types";
import { useState } from "react";

interface LoggedEntriesProps {
  entries: NutritionLogRow[];
  deletingId: string | null;
  onDelete: (id: string) => void;
  embedded?: boolean;
}

export function LoggedEntries({
  entries,
  deletingId,
  onDelete,
  embedded = false,
}: LoggedEntriesProps) {
  const content = (
    <>
      <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
        Logged today
      </h2>
      {entries.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-[var(--border)] p-8 text-center">
          <p className="text-forge-muted">
            Log a meal below or tap a saved meal to adjust portions first.
          </p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {entries.map((entry) => (
            <LoggedEntryCard
              key={entry.id}
              entry={entry}
              deleting={deletingId === entry.id}
              onDelete={() => onDelete(entry.id)}
            />
          ))}
        </div>
      )}
    </>
  );

  if (embedded) return content;

  return (
    <section className="flex flex-col gap-4 sm:gap-5">{content}</section>
  );
}

function LoggedEntryCard({
  entry,
  deleting,
  onDelete,
}: {
  entry: NutritionLogRow;
  deleting: boolean;
  onDelete: () => void;
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
        <button
          type="button"
          disabled={deleting}
          onClick={onDelete}
          className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-forge-coral disabled:opacity-50"
        >
          {deleting ? "…" : "Remove"}
        </button>
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
