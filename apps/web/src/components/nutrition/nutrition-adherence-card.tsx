import type { NutritionAdherenceSummary } from "@/lib/analytics/types";

interface NutritionAdherenceCardProps {
  adherence: NutritionAdherenceSummary | null;
}

export function NutritionAdherenceCard({
  adherence,
}: NutritionAdherenceCardProps) {
  if (!adherence?.targets) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-forge-muted">
        Active program nutrition targets are required for adherence tracking.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-forge-muted">
        Days within ±10% of your program targets (
        {adherence.targets.proteinG}g protein · {adherence.targets.calories}{" "}
        kcal).
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        {adherence.windows.map((window) => (
          <div
            key={window.days}
            className="rounded-xl border border-[var(--border)] bg-forge-surface px-4 py-3"
          >
            <p className="text-xs uppercase tracking-wider text-forge-muted">
              Last {window.days} days
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-forge-gold">
              {window.proteinHitPct}%
            </p>
            <p className="text-xs text-forge-muted">Protein on target</p>
            <p className="mt-2 text-sm text-forge-text">
              Calories: {window.calorieHitPct}%
            </p>
            <p className="text-xs text-forge-muted">
              Logged {window.daysLogged}/{window.days} days
            </p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-forge-muted">
          Last 14 days
        </p>
        <div className="mt-2 grid grid-cols-7 gap-1.5">
          {adherence.recentDays.slice(-14).map((day) => (
            <div
              key={day.date}
              title={`${day.date} · protein ${day.logged ? (day.proteinHit ? "hit" : "miss") : "no log"}`}
              className={`h-8 rounded-md border ${
                !day.logged
                  ? "border-[var(--border)] bg-forge-surface"
                  : day.proteinHit
                    ? "border-forge-success/40 bg-forge-success/20"
                    : "border-forge-gold/30 bg-forge-gold/10"
              }`}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-forge-muted">
          Green = protein on target · gold = logged but off target · empty = no
          log
        </p>
      </div>
    </div>
  );
}
