"use client";

import { EvidenceExplainerLink } from "@/components/evidence/evidence-explainer-link";
import { buildEvidenceHref } from "@/lib/evidence/present";
import type { MacroTotals } from "@forgefit/nutrition-core";
import type { NutritionTargets } from "@forgefit/program-engine";

interface MacroSummaryProps {
  totals: MacroTotals;
  targets: NutritionTargets | null;
  /** Omit outer card shell when nested inside another section */
  embedded?: boolean;
  /** Compact 2×2 grid — fits above the log hub without pushing inputs down */
  variant?: "default" | "compact";
  /** Hide training/TDEE footnotes when a dedicated energy panel is shown */
  showTargetDetails?: boolean;
}

export function MacroSummary({
  totals,
  targets,
  embedded = false,
  variant = "default",
  showTargetDetails = true,
}: MacroSummaryProps) {
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

  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
          Today&apos;s macros
        </h2>
        {targets && (
          <EvidenceExplainerLink
            href={buildEvidenceHref({
              focus: targets.proteinRuleId,
              related: targets.calorieRuleId
                ? [targets.calorieRuleId]
                : undefined,
            })}
            label="Why these targets?"
          />
        )}
      </div>

      <div
        className={
          variant === "compact"
            ? "mt-3 grid grid-cols-2 gap-2 sm:gap-3"
            : "mt-4 space-y-4"
        }
      >
        {items.map((item) => {
          const pct =
            item.target && item.target > 0
              ? Math.min(100, Math.round((item.current / item.target) * 100))
              : null;

          if (variant === "compact") {
            return (
              <div
                key={item.label}
                className="rounded-xl border border-[var(--border)] bg-forge-surface px-3 py-2.5"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-medium text-forge-muted">
                    {item.label}
                  </span>
                  <span className="text-xs text-forge-muted">
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
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-forge-surface-raised">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${pct ?? (item.current > 0 ? 8 : 0)}%` }}
                  />
                </div>
              </div>
            );
          }

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

      {showTargetDetails &&
        targets?.trainingKcalPerDay != null &&
        targets.trainingLoad && (
        variant === "compact" ? (
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-semibold text-forge-steel hover:text-forge-ember">
              About your targets
            </summary>
            <p className="mt-2 text-sm text-forge-muted">
              Includes ~{targets.trainingKcalPerDay} kcal/day from your{" "}
              {targets.trainingLoad.sessionsPerWeek}×
              {Math.round(
                targets.trainingLoad.weeklyEstimatedMinutes /
                  Math.max(1, targets.trainingLoad.sessionsPerWeek)
              )}{" "}
              min training plan.
              {targets.effectiveDeficitKcal != null && (
                <>
                  {" "}
                  Effective deficit ~{targets.effectiveDeficitKcal} kcal/day.
                </>
              )}
              {targets.effectiveSurplusKcal != null && (
                <>
                  {" "}
                  Effective surplus ~{targets.effectiveSurplusKcal} kcal/day.
                </>
              )}
            </p>
          </details>
        ) : (
          <p className="mt-4 text-sm text-forge-muted">
            Includes ~{targets.trainingKcalPerDay} kcal/day from your{" "}
            {targets.trainingLoad.sessionsPerWeek}×
            {Math.round(
              targets.trainingLoad.weeklyEstimatedMinutes /
                Math.max(1, targets.trainingLoad.sessionsPerWeek)
            )}{" "}
            min training plan.
            {targets.effectiveDeficitKcal != null && (
              <>
                {" "}
                Effective deficit ~{targets.effectiveDeficitKcal} kcal/day.
              </>
            )}
            {targets.effectiveSurplusKcal != null && (
              <>
                {" "}
                Effective surplus ~{targets.effectiveSurplusKcal} kcal/day.
              </>
            )}
          </p>
        )
      )}

      {!targets && (
        <p
          className={
            variant === "compact" ? "mt-3 text-xs text-forge-muted" : "mt-4 text-sm text-forge-muted"
          }
        >
          Generate your program to see personalized calorie and macro targets.
        </p>
      )}
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

function formatAmount(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
