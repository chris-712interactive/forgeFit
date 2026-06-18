import { MacroSummary } from "@/components/nutrition/macro-summary";
import type { ActivityContext } from "@/lib/activity/types";
import type { DailyNutritionSummary } from "@/lib/nutrition/types";
import Link from "next/link";

interface HomeTodaySnapshotProps {
  nutrition: DailyNutritionSummary;
  activity: ActivityContext;
}

export function HomeTodaySnapshot({
  nutrition,
  activity,
}: HomeTodaySnapshotProps) {
  const today = activity.today;
  const showActivity =
    activity.unlocked &&
    (activity.hasActivityData || activity.fitbitConnected);
  const showMetrics = activity.hasActivityData || activity.fitbitConnected;

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
          Today
        </h2>
        <Link
          href="/nutrition"
          className="text-xs font-semibold text-forge-steel hover:text-forge-ember"
        >
          Log food →
        </Link>
      </div>

      <MacroSummary
        totals={nutrition.totals}
        targets={nutrition.targets}
        variant="compact"
        embedded
      />

      {showActivity && (
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-forge-muted">
              Activity
              {activity.hasActivityData && activity.activityDayLabel !== "Today" && (
                <span className="ml-1.5 normal-case text-forge-steel">
                  · {activity.activityDayLabel}
                </span>
              )}
            </p>
            <Link
              href="/progress"
              className="text-xs font-semibold text-forge-steel hover:text-forge-ember"
            >
              Trends →
            </Link>
          </div>
          {showMetrics ? (
            <>
              <div className="grid grid-cols-3 gap-2">
                <ActivityTile
                  label="Steps"
                  value={
                    today?.steps != null ? today.steps.toLocaleString() : "—"
                  }
                />
                <ActivityTile
                  label="Active cal"
                  value={
                    today?.activeCalories != null
                      ? String(Math.round(today.activeCalories))
                      : "—"
                  }
                />
                <ActivityTile
                  label="Active min"
                  value={
                    today?.activeMinutes != null
                      ? String(today.activeMinutes)
                      : "—"
                  }
                />
              </div>
              {!activity.hasActivityData && activity.fitbitConnected && (
                <p className="mt-2 text-xs text-forge-muted">
                  No activity imported yet — sync from Profile → Integrations.
                </p>
              )}
            </>
          ) : (
            <Link
              href="/profile#integrations"
              className="text-xs text-forge-muted hover:text-forge-steel"
            >
              Connect Fitbit in Profile to see steps here →
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

function ActivityTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-forge-surface px-2 py-2 text-center">
      <p className="text-[10px] uppercase tracking-wide text-forge-muted">
        {label}
      </p>
      <p className="font-display text-lg font-bold text-forge-steel">{value}</p>
    </div>
  );
}
