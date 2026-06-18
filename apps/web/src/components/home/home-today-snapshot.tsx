import { MacroSummary } from "@/components/nutrition/macro-summary";
import type { ActivityContext } from "@/lib/activity/types";
import type { SleepContext } from "@/lib/sleep/types";
import type { DailyNutritionSummary } from "@/lib/nutrition/types";
import { formatSleepHours } from "@/lib/sleep/format";
import Link from "next/link";

interface HomeTodaySnapshotProps {
  nutrition: DailyNutritionSummary;
  activity: ActivityContext;
  sleep: SleepContext;
}

export function HomeTodaySnapshot({
  nutrition,
  activity,
  sleep,
}: HomeTodaySnapshotProps) {
  const today = activity.today;
  const showActivity =
    activity.unlocked &&
    (activity.hasActivityData || activity.fitbitConnected);
  const showMetrics = activity.hasActivityData || activity.fitbitConnected;
  const showSleep =
    sleep.unlocked && (sleep.hasSleepData || sleep.fitbitConnected);
  const showSleepMetrics = sleep.hasSleepData || sleep.sleepScopeGranted;

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
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                {showSleep && (
                  <ActivityTile
                    label="Sleep"
                    value={
                      showSleepMetrics
                        ? formatSleepHours(sleep.lastNight?.durationMinutes)
                        : "—"
                    }
                    hint={
                      sleep.hasSleepData &&
                      sleep.sleepDayLabel !== "Last night"
                        ? sleep.sleepDayLabel
                        : undefined
                    }
                  />
                )}
              </div>
              {showSleep &&
                sleep.fitbitConnected &&
                !sleep.sleepScopeGranted && (
                  <p className="mt-2 text-xs text-forge-muted">
                    Reconnect Fitbit in Profile to import sleep data.
                  </p>
                )}
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

function ActivityTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-forge-surface px-2 py-2 text-center">
      <p className="text-[10px] uppercase tracking-wide text-forge-muted">
        {label}
        {hint && (
          <span className="ml-1 normal-case text-forge-steel">· {hint}</span>
        )}
      </p>
      <p className="font-display text-lg font-bold text-forge-steel">{value}</p>
    </div>
  );
}
