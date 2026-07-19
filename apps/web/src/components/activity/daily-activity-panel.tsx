import type { ActivityContext } from "@/lib/activity/types";
import { formatCalories, formatSedentaryHours } from "@/lib/activity/format";
import { FEATURE_TEMPORARILY_UNAVAILABLE } from "@/lib/ui/member-errors";
import Link from "next/link";
import { ActivityTrendChart } from "./activity-trend-chart";

interface DailyActivityPanelProps {
  activity: ActivityContext;
}

export function DailyActivityPanel({ activity }: DailyActivityPanelProps) {
  if (!activity.fitbitConnected && !activity.hasActivityData) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-forge-muted">
        <p>
          Connect Fitbit in Profile to import daily steps, active calories, zone
          minutes, and sedentary time.
        </p>
        <Link
          href="/profile#integrations"
          className="mt-3 inline-flex font-semibold text-forge-steel hover:text-forge-ember"
        >
          Open Integrations →
        </Link>
      </div>
    );
  }

  const stats = activity.weekStats;

  return (
    <div className="space-y-5">
      {!activity.tableReady && (
        <p className="rounded-xl border border-forge-gold/30 bg-forge-surface px-3 py-2 text-xs text-forge-muted">
          {FEATURE_TEMPORARILY_UNAVAILABLE}
        </p>
      )}

      {activity.lastSyncError && (
        <p className="rounded-xl border border-forge-coral/40 bg-forge-surface px-3 py-2 text-xs text-forge-coral">
          Sync error — retry from Profile → Integrations.
        </p>
      )}

      {stats && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "7-day avg steps",
                value: stats.avgSteps?.toLocaleString() ?? "—",
              },
              {
                label: "7-day avg cal",
                value: formatCalories(stats.avgActiveCalories),
              },
              {
                label: "7-day avg min",
                value:
                  stats.avgActiveMinutes != null
                    ? String(stats.avgActiveMinutes)
                    : "—",
              },
            ].map((tile) => (
              <article
                key={tile.label}
                className="rounded-xl border border-[var(--border)] bg-forge-surface px-3 py-3"
              >
                <p className="text-[11px] font-medium uppercase tracking-wide text-forge-muted">
                  {tile.label}
                </p>
                <p className="mt-1 font-display text-xl font-bold text-forge-text">
                  {tile.value}
                </p>
              </article>
            ))}
          </div>

          {activity.hasExtendedActivityData && (
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "7-day avg AZM",
                  value:
                    stats.avgActiveZoneMinutes != null
                      ? String(stats.avgActiveZoneMinutes)
                      : "—",
                },
                {
                  label: "7-day sedentary",
                  value: formatSedentaryHours(stats.avgSedentaryMinutes),
                },
                {
                  label: "7-day total cal",
                  value: formatCalories(stats.avgTotalCalories),
                },
              ].map((tile) => (
                <article
                  key={tile.label}
                  className="rounded-xl border border-[var(--border)] bg-forge-surface px-3 py-3"
                >
                  <p className="text-[11px] font-medium uppercase tracking-wide text-forge-muted">
                    {tile.label}
                  </p>
                  <p className="mt-1 font-display text-xl font-bold text-forge-text">
                    {tile.value}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      <ActivityTrendChart series={activity.series} />

      {activity.lastSyncAt && (
        <p className="text-xs text-forge-muted">
          Last synced{" "}
          {new Date(activity.lastSyncAt).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
          . Manage connection in{" "}
          <Link
            href="/profile#integrations"
            className="font-semibold text-forge-steel hover:text-forge-ember"
          >
            Profile → Integrations
          </Link>
          .
        </p>
      )}
    </div>
  );
}
