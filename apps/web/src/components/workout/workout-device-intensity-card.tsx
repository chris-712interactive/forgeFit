"use client";

import { EvidenceExplainerLink } from "@/components/evidence/evidence-explainer-link";
import { buildEvidenceHref } from "@/lib/evidence/present";
import { verdictLabel } from "@/lib/workouts/intensity-assessment";
import type { WorkoutDeviceMetricsRecord } from "@/lib/workouts/device-metrics-types";

interface WorkoutDeviceIntensityCardProps {
  metrics: WorkoutDeviceMetricsRecord | null;
  pendingDeviceSync: boolean;
  fitbitConnected: boolean;
}

const VERDICT_STYLES = {
  on_target: "bg-forge-success/15 text-forge-success",
  too_easy: "bg-forge-gold/15 text-forge-gold",
  too_hard: "bg-forge-coral/15 text-forge-coral",
  inconclusive: "bg-forge-steel/15 text-forge-steel",
} as const;

function zoneBar(metrics: WorkoutDeviceMetricsRecord) {
  const segments = [
    { key: "light", seconds: metrics.zoneLightSeconds ?? 0, className: "bg-forge-steel/40" },
    { key: "fat", seconds: metrics.zoneFatBurnSeconds ?? 0, className: "bg-forge-gold/60" },
    { key: "cardio", seconds: metrics.zoneCardioSeconds ?? 0, className: "bg-forge-ember/60" },
    { key: "peak", seconds: metrics.zonePeakSeconds ?? 0, className: "bg-forge-coral/70" },
  ];
  const total = segments.reduce((sum, segment) => sum + segment.seconds, 0);
  if (total <= 0) return null;

  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-forge-muted">Heart-rate zones</p>
      <div className="mt-1 flex h-2 overflow-hidden rounded-full bg-forge-surface">
        {segments
          .filter((segment) => segment.seconds > 0)
          .map((segment) => (
            <div
              key={segment.key}
              className={segment.className}
              style={{ width: `${(segment.seconds / total) * 100}%` }}
            />
          ))}
      </div>
    </div>
  );
}

export function WorkoutDeviceIntensityCard({
  metrics,
  pendingDeviceSync,
  fitbitConnected,
}: WorkoutDeviceIntensityCardProps) {
  if (!fitbitConnected) {
    return null;
  }

  if (pendingDeviceSync) {
    return (
      <section className="mt-6 rounded-2xl border border-forge-steel/30 bg-forge-steel/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-forge-steel">
          Watch intensity
        </p>
        <p className="mt-1 text-sm text-forge-muted">
          Syncing Fitbit exercise data — check back in a moment or pull to refresh
          after your watch syncs.
        </p>
      </section>
    );
  }

  if (!metrics || metrics.matchConfidence === "none") {
    return (
      <section className="mt-6 rounded-2xl border border-forge-steel/30 bg-forge-steel/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-forge-steel">
          Watch intensity
        </p>
        <p className="mt-1 text-sm text-forge-muted">
          No matching Fitbit exercise session found for this workout window. Wear
          your watch during training for heart-rate correlation.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-2xl border border-forge-ember/30 bg-forge-ember/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-forge-ember">
            Watch intensity
          </p>
          {metrics.displayName && (
            <p className="mt-1 text-sm text-forge-muted">
              Matched {metrics.displayName}
              {metrics.matchConfidence !== "high"
                ? ` (${metrics.matchConfidence} confidence)`
                : ""}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-lg px-2 py-1 text-xs font-semibold ${VERDICT_STYLES[metrics.intensityVerdict]}`}
        >
          {verdictLabel(metrics.intensityVerdict)}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
        {metrics.avgHeartRateBpm != null && (
          <div>
            <p className="text-xs text-forge-muted">Avg HR</p>
            <p className="font-semibold text-forge-text">
              {metrics.avgHeartRateBpm} bpm
            </p>
          </div>
        )}
        {metrics.activeZoneMinutes != null && (
          <div>
            <p className="text-xs text-forge-muted">Active Zone Min</p>
            <p className="font-semibold text-forge-text">
              {metrics.activeZoneMinutes}
            </p>
          </div>
        )}
        {metrics.loggedAvgRir != null && (
          <div>
            <p className="text-xs text-forge-muted">Logged avg RIR</p>
            <p className="font-semibold text-forge-text">
              {metrics.loggedAvgRir.toFixed(1)}
            </p>
          </div>
        )}
      </div>

      {zoneBar(metrics)}

      {metrics.evidenceRuleId && (
        <div className="mt-3">
          <EvidenceExplainerLink
            href={buildEvidenceHref({ focus: metrics.evidenceRuleId })}
            label="See intensity evidence"
          />
        </div>
      )}
    </section>
  );
}
