import { MacroSummary } from "@/components/nutrition/macro-summary";
import type { DailyNutritionSummary } from "@/lib/nutrition/types";
import Link from "next/link";

interface HomeMacroTrackerProps {
  summary: DailyNutritionSummary;
}

export function HomeMacroTracker({ summary }: HomeMacroTrackerProps) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs text-forge-muted">
          Quick-log macros to close the gap on your targets
        </p>
        <Link
          href="/nutrition"
          className="text-xs font-semibold text-forge-steel hover:text-forge-ember"
        >
          Log macros →
        </Link>
      </div>
      <MacroSummary
        totals={summary.totals}
        targets={summary.targets}
        embedded
      />
    </section>
  );
}
