import { MacroSummary } from "@/components/nutrition/macro-summary";
import type { DailyNutritionSummary } from "@/lib/nutrition/types";
import Link from "next/link";

interface HomeMacroTrackerProps {
  summary: DailyNutritionSummary;
}

export function HomeMacroTracker({ summary }: HomeMacroTrackerProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <p className="text-xs text-forge-muted">
          Log meals to close the gap on your targets
        </p>
        <Link
          href="/nutrition"
          className="text-xs font-semibold text-forge-steel hover:text-forge-ember"
        >
          Log food →
        </Link>
      </div>
      <MacroSummary totals={summary.totals} targets={summary.targets} />
    </div>
  );
}
