import type { SleepContext } from "@/lib/sleep/types";
import { formatSleepHours } from "@/lib/sleep/format";
import { FEATURE_TEMPORARILY_UNAVAILABLE } from "@/lib/ui/member-errors";
import Link from "next/link";
import { SleepTrendChart } from "./sleep-trend-chart";

interface DailySleepPanelProps {
  sleep: SleepContext;
}

export function DailySleepPanel({ sleep }: DailySleepPanelProps) {
  if (!sleep.fitbitConnected && !sleep.hasSleepData) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-forge-muted">
        <p>
          Connect Fitbit in Profile to import nightly sleep duration and trends.
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

  const stats = sleep.weekStats;
  const lastNight = sleep.lastNight;

  return (
    <div className="space-y-5">
      {!sleep.tableReady && (
        <p className="rounded-xl border border-forge-gold/30 bg-forge-surface px-3 py-2 text-xs text-forge-muted">
          {FEATURE_TEMPORARILY_UNAVAILABLE}
        </p>
      )}

      {sleep.fitbitConnected && !sleep.sleepScopeGranted && (
        <p className="rounded-xl border border-forge-gold/30 bg-forge-surface px-3 py-2 text-xs text-forge-muted">
          Reconnect Fitbit in Profile to grant sleep access — existing
          connections only include activity data.
        </p>
      )}

      {sleep.lastSyncError && (
        <p className="rounded-xl border border-forge-coral/40 bg-forge-surface px-3 py-2 text-xs text-forge-coral">
          Sync error — retry from Profile → Integrations.
        </p>
      )}

      {sleep.bedtimeSuggestion?.show && (
        <div className="rounded-2xl border border-forge-steel/30 bg-forge-steel/5 p-4">
          <p className="font-display text-sm font-semibold text-forge-text">
            Bedtime suggestion
          </p>
          <p className="mt-1 text-sm leading-relaxed text-forge-muted">
            {sleep.bedtimeSuggestion.summary}
          </p>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "7-day avg sleep",
              value: formatSleepHours(stats.avgDurationMinutes),
            },
            {
              label: "Nights logged",
              value: String(stats.nightsWithData),
            },
            {
              label: "Under 7h",
              value: String(stats.shortNights),
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

      {lastNight?.durationMinutes != null && (
        <p className="text-sm text-forge-muted">
          Last logged night ({sleep.sleepDayLabel.toLowerCase()}):{" "}
          <span className="font-semibold text-forge-text">
            {formatSleepHours(lastNight.durationMinutes)}
          </span>
          {lastNight.deepMinutes != null && (
            <> · Deep {Math.round(lastNight.deepMinutes / 60)}h</>
          )}
          {lastNight.remMinutes != null && (
            <> · REM {Math.round(lastNight.remMinutes / 60)}h</>
          )}
        </p>
      )}

      <SleepTrendChart series={sleep.series} />

      {sleep.lastSyncAt && (
        <p className="text-[11px] text-forge-muted">
          Last Fitbit sync{" "}
          {new Date(sleep.lastSyncAt).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      )}
    </div>
  );
}
