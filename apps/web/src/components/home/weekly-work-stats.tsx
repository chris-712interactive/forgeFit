"use client";

import { useUnitPreference } from "@/components/units/unit-preference-provider";
import type { WeeklyWorkStats } from "@/lib/home/types";
import { kgToDisplayValue, weightUnitLabel } from "@/lib/units/measurements";

interface WeeklyWorkStatsProps {
  stats: WeeklyWorkStats;
}

export function WeeklyWorkStatsGrid({ stats }: WeeklyWorkStatsProps) {
  const unit = useUnitPreference();
  const weightLabel = weightUnitLabel(unit);
  const volumeDisplay = kgToDisplayValue(stats.totalVolumeKg, unit);
  const distance =
    unit === "imperial"
      ? `${stats.estimatedDistanceMiles} mi`
      : `${(stats.estimatedDistanceMiles * 1.60934).toFixed(1)} km`;

  const tiles = [
    {
      label: "Volume lifted",
      value: `${volumeDisplay.toLocaleString()}`,
      unit: weightLabel,
      accent: "text-forge-ember",
    },
    {
      label: "Sets logged",
      value: String(stats.totalSets),
      unit: "sets",
      accent: "text-forge-coral",
    },
    {
      label: "Cardio distance",
      value: stats.estimatedDistanceMiles > 0 ? distance.split(" ")[0] : "—",
      unit: stats.estimatedDistanceMiles > 0 ? distance.split(" ")[1] : "est.",
      accent: "text-forge-steel",
    },
    {
      label: "Recovery time",
      value: stats.recoveryMinutes > 0 ? String(stats.recoveryMinutes) : "—",
      unit: stats.recoveryMinutes > 0 ? "min" : "planned",
      accent: "text-forge-gold",
    },
    {
      label: "Training time",
      value: stats.trainingMinutes > 0 ? String(stats.trainingMinutes) : "—",
      unit: stats.trainingMinutes > 0 ? "min" : "this week",
      accent: "text-forge-text",
    },
    {
      label: "Cardio time",
      value: stats.cardioMinutes > 0 ? String(stats.cardioMinutes) : "—",
      unit: stats.cardioMinutes > 0 ? "min" : "logged",
      accent: "text-forge-steel",
    },
  ];

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
        Body of work
      </h2>
      <p className="mt-1 text-xs text-forge-muted">
        Your logged effort this week — accountability at a glance
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
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
    </section>
  );
}
