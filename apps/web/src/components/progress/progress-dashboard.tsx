"use client";

import type { ProgressDashboardData } from "@/lib/measurements/types";
import { CaliperCalculator } from "./caliper-calculator";
import { LogMeasurementForm } from "./log-measurement-form";
import { MeasurementTrendChart } from "./measurement-trend-chart";
import { WeightProjectionChart } from "./weight-projection-chart";

interface ProgressDashboardProps {
  data: ProgressDashboardData;
}

export function ProgressDashboard({ data }: ProgressDashboardProps) {
  return (
    <div className="mt-6 space-y-6">
      {!data.tableReady && (
        <div className="rounded-2xl border border-forge-gold/40 bg-forge-surface-raised p-4 text-sm text-forge-muted">
          Apply the Phase 5 migration (`body_measurements` tables) to save new
          entries. Charts still use your onboarding baseline.
        </div>
      )}

      <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
          Weight trend
        </h2>
        <div className="mt-4">
          <MeasurementTrendChart series={data.trends} />
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
          30-day projection
        </h2>
        <p className="mt-1 text-xs text-forge-muted">
          Free tier · evidence-capped trend from your log
          {data.goal ? ` (${data.goal.replace(/_/g, " ")})` : ""}
        </p>
        <div className="mt-4">
          <WeightProjectionChart projection={data.projection} />
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
          Log measurement
        </h2>
        <div className="mt-4">
          <LogMeasurementForm />
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
          Caliper body fat
        </h2>
        <p className="mt-1 text-xs text-forge-muted">
          Jackson-Pollock 3- or 7-site · saved to your progress log
        </p>
        <div className="mt-4">
          <CaliperCalculator sex={data.sex} age={data.age} />
        </div>
        {data.caliperEntries.length > 0 && (
          <ul className="mt-4 space-y-2 border-t border-[var(--border)] pt-4 text-sm">
            {data.caliperEntries.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-3"
              >
                <span className="text-forge-muted">{entry.measuredDate}</span>
                <span className="font-medium text-forge-text">
                  {entry.bodyFatPct}% · {entry.formula.toUpperCase()} (
                  {entry.sumMm} mm)
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
