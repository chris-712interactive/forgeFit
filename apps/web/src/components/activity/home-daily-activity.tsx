import type { ActivityContext } from "@/lib/activity/types";
import Link from "next/link";

interface HomeDailyActivityProps {
  activity: ActivityContext;
}

function formatSyncTime(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMetric(value: number | null, fallback = "—"): string {
  if (value == null) return fallback;
  return value.toLocaleString();
}

export function HomeDailyActivity({ activity }: HomeDailyActivityProps) {
  if (!activity.unlocked) {
    return null;
  }

  if (!activity.fitbitConnected) {
    return (
      <section className="rounded-2xl border border-dashed border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
          Daily activity
        </h2>
        <p className="mt-2 text-sm text-forge-muted">
          Connect Fitbit via Google Health to see steps and active calories on
          your dashboard.
        </p>
        <Link
          href="/profile#integrations"
          className="mt-3 inline-flex text-sm font-semibold text-forge-steel hover:text-forge-ember"
        >
          Connect in Profile →
        </Link>
      </section>
    );
  }

  const today = activity.today;
  const hasTodayData =
    today != null &&
    (today.steps != null ||
      today.activeCalories != null ||
      today.activeMinutes != null);
  const lastSync = formatSyncTime(activity.lastSyncAt);

  const tiles = [
    {
      label: "Steps",
      value: formatMetric(today?.steps ?? null),
      unit: activity.activityDayLabel.toLowerCase(),
      accent: "text-forge-steel",
    },
    {
      label: "Active cal",
      value: formatMetric(
        today?.activeCalories != null
          ? Math.round(today.activeCalories)
          : null
      ),
      unit: "burned",
      accent: "text-forge-ember",
    },
    today?.activeZoneMinutes != null
      ? {
          label: "AZM",
          value: formatMetric(today.activeZoneMinutes),
          unit: activity.activityDayLabel.toLowerCase(),
          accent: "text-forge-gold",
        }
      : {
          label: "Active min",
          value: formatMetric(today?.activeMinutes ?? null),
          unit: activity.activityDayLabel.toLowerCase(),
          accent: "text-forge-gold",
        },
  ];

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
            Daily activity
          </h2>
          <p className="mt-1 text-xs text-forge-muted">
            From Fitbit via Google Health
            {lastSync ? ` · synced ${lastSync}` : ""}
          </p>
        </div>
        <Link
          href="/progress"
          className="text-xs font-semibold text-forge-steel hover:text-forge-ember"
        >
          View trends →
        </Link>
      </div>

      {!activity.tableReady && (
        <p className="mt-3 rounded-xl border border-forge-gold/30 bg-forge-surface px-3 py-2 text-xs text-forge-muted">
          Apply the daily activity migration to persist imported Fitbit data.
        </p>
      )}

      {activity.lastSyncError && (
        <p className="mt-3 rounded-xl border border-forge-coral/40 bg-forge-surface px-3 py-2 text-xs text-forge-coral">
          Last sync issue — open Profile → Integrations to retry.
        </p>
      )}

      <div className="mt-4 grid grid-cols-3 gap-3">
        {tiles.map((tile) => (
          <article
            key={tile.label}
            className="rounded-xl border border-[var(--border)] bg-forge-surface px-3 py-3"
          >
            <p className="text-[11px] font-medium uppercase tracking-wide text-forge-muted">
              {tile.label}
            </p>
            <p className={`mt-1 font-display text-2xl font-bold ${tile.accent}`}>
              {tile.value}
            </p>
            <p className="text-xs text-forge-muted">{tile.unit}</p>
          </article>
        ))}
      </div>

      {!hasTodayData && activity.weekStats && (
        <p className="mt-3 text-xs text-forge-muted">
          No data for today yet — 7-day avg{" "}
          {activity.weekStats.avgSteps?.toLocaleString() ?? "—"} steps.
        </p>
      )}

      {!hasTodayData && !activity.weekStats && (
        <p className="mt-3 text-xs text-forge-muted">
          No activity imported yet. Sync from Profile → Integrations after
          linking Fitbit to Google Health.
        </p>
      )}
    </section>
  );
}
