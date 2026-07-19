import type { RecoveryContext } from "@/lib/recovery/types";
import {
  formatHrvMs,
  formatRestingHr,
  recoveryMidpoint,
} from "@/lib/recovery/format";
import { FEATURE_TEMPORARILY_UNAVAILABLE } from "@/lib/ui/member-errors";
import Link from "next/link";
import { RecoveryTrendChart } from "./recovery-trend-chart";

interface DailyRecoveryPanelProps {
  recovery: RecoveryContext;
}

export function DailyRecoveryPanel({ recovery }: DailyRecoveryPanelProps) {
  if (!recovery.fitbitConnected && !recovery.hasRecoveryData) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-forge-muted">
        <p>
          Connect Fitbit in Profile to import resting heart rate and HRV trends.
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

  const stats = recovery.weekStats;
  const latest = recovery.latest;

  return (
    <div className="space-y-5">
      {!recovery.tableReady && (
        <p className="rounded-xl border border-forge-gold/30 bg-forge-surface px-3 py-2 text-xs text-forge-muted">
          {FEATURE_TEMPORARILY_UNAVAILABLE}
        </p>
      )}

      {recovery.fitbitConnected && !recovery.recoveryScopeGranted && (
        <p className="rounded-xl border border-forge-gold/30 bg-forge-surface px-3 py-2 text-xs text-forge-muted">
          Reconnect Fitbit in Profile to grant health metrics access — existing
          connections may not include resting HR and HRV.
        </p>
      )}

      {recovery.lastSyncError && (
        <p className="rounded-xl border border-forge-coral/40 bg-forge-surface px-3 py-2 text-xs text-forge-coral">
          Sync error — retry from Profile → Integrations.
        </p>
      )}

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "7-day avg RHR",
              value: formatRestingHr(stats.avgRestingHrBpm),
            },
            {
              label: "7-day avg HRV",
              value: formatHrvMs(stats.avgHrvMs),
            },
            {
              label: "Low HRV days",
              value: String(stats.lowHrvDays),
            },
            {
              label: "Days logged",
              value: String(stats.daysWithData),
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

      {latest && (
        <p className="text-sm text-forge-muted">
          Latest ({recovery.recoveryDayLabel.toLowerCase()}):{" "}
          <span className="font-semibold text-forge-text">
            {formatRestingHr(
              recoveryMidpoint(latest.restingHrMin, latest.restingHrMax)
            )}
          </span>
          {" · "}
          <span className="font-semibold text-forge-text">
            HRV{" "}
            {formatHrvMs(recoveryMidpoint(latest.hrvMsMin, latest.hrvMsMax))}
          </span>
        </p>
      )}

      <RecoveryTrendChart series={recovery.series} />

      {recovery.lastSyncAt && (
        <p className="text-[11px] text-forge-muted">
          Last Fitbit sync{" "}
          {new Date(recovery.lastSyncAt).toLocaleString(undefined, {
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
