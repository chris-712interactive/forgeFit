"use client";

import type { MacroTotals } from "@forgefit/nutrition-core";
import type { NutritionTargets } from "@forgefit/program-engine";

interface MacroSummaryProps {
  totals: MacroTotals;
  targets: NutritionTargets | null;
}

export function MacroSummary({ totals, targets }: MacroSummaryProps) {
  const items = [
    {
      label: "Calories",
      current: totals.calories,
      target: targets?.calories ?? null,
      unit: "",
      color: "bg-forge-ember",
    },
    {
      label: "Protein",
      current: totals.proteinG,
      target: targets?.proteinG ?? null,
      unit: "g",
      color: "bg-forge-coral",
    },
    {
      label: "Carbs",
      current: totals.carbsG,
      target: targets?.carbsG ?? null,
      unit: "g",
      color: "bg-forge-gold",
    },
    {
      label: "Fat",
      current: totals.fatG,
      target: targets?.fatG ?? null,
      unit: "g",
      color: "bg-forge-steel",
    },
  ];

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
          Today&apos;s macros
        </h2>
        {targets && (
          <span className="text-xs text-forge-muted">Evidence-based targets</span>
        )}
      </div>

      <div className="mt-4 space-y-4">
        {items.map((item) => {
          const pct =
            item.target && item.target > 0
              ? Math.min(100, Math.round((item.current / item.target) * 100))
              : null;

          return (
            <div key={item.label}>
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-forge-text">
                  {item.label}
                </span>
                <span className="text-sm text-forge-muted">
                  {formatAmount(item.current)}
                  {item.unit}
                  {item.target != null && (
                    <span className="text-forge-steel">
                      {" "}
                      / {formatAmount(item.target)}
                      {item.unit}
                    </span>
                  )}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-forge-surface">
                <div
                  className={`h-full rounded-full ${item.color}`}
                  style={{ width: `${pct ?? (item.current > 0 ? 8 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {!targets && (
        <p className="mt-4 text-sm text-forge-muted">
          Generate your program to see personalized calorie and macro targets.
        </p>
      )}
    </section>
  );
}

function formatAmount(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
