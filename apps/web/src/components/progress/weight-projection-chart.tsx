"use client";

import { useUnitPreference } from "@/components/units/unit-preference-provider";
import {
  cmToDisplayValue,
  kgToDisplayValue,
  weightUnitLabel,
} from "@/lib/units/measurements";
import type { WeightProjectionResult } from "@forgefit/projection-engine";
import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EvidenceRuleInline } from "@/components/evidence/evidence-rule-inline";
import { ChartShell } from "./chart-shell";
import { CHART_COLORS } from "./chart-colors";

interface WeightProjectionChartProps {
  projection: WeightProjectionResult | null;
  showConfidenceBands?: boolean;
  showGoalDate?: boolean;
  goalWeightKg?: number | null;
}

function formatTick(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

export function WeightProjectionChart({
  projection,
  showConfidenceBands = false,
  showGoalDate = false,
  goalWeightKg = null,
}: WeightProjectionChartProps) {
  const unit = useUnitPreference();
  const weightLabel = weightUnitLabel(unit);

  const chartData = useMemo(() => {
    if (!projection) return [];

    const actual = projection.points.filter((point) => !point.projected);
    const pivotDate = actual[actual.length - 1]?.date;

    return projection.points.map((point) => ({
      date: point.date,
      actual: point.projected
        ? null
        : kgToDisplayValue(point.weightKg, unit),
      projected: point.projected
        ? kgToDisplayValue(point.weightKg, unit)
        : null,
      bridge:
        point.date === pivotDate
          ? kgToDisplayValue(point.weightKg, unit)
          : null,
      bandRange:
        showConfidenceBands &&
        point.bandLowKg != null &&
        point.bandHighKg != null
          ? [
              kgToDisplayValue(point.bandLowKg, unit),
              kgToDisplayValue(point.bandHighKg, unit),
            ]
          : null,
    }));
  }, [projection, showConfidenceBands, unit]);

  if (!projection) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-forge-muted">
        Add weight entries to generate a projection.
      </div>
    );
  }

  const actual = projection.points.filter((point) => !point.projected);
  const pivotDate = actual[actual.length - 1]?.date;
  const weeklyDisplay = kgToDisplayValue(
    Math.abs(projection.weeklyChangeKg),
    unit
  );
  const weeklySign = projection.weeklyChangeKg > 0 ? "+" : "-";
  const lastProjected = projection.points.filter((point) => point.projected).at(-1);

  return (
    <div className="space-y-3">
      <p className="text-sm text-forge-muted">
        Trend pace:{" "}
        <span className="font-medium text-forge-gold">
          {weeklySign}
          {weeklyDisplay} {weightLabel}/week
        </span>{" "}
        ({projection.weeklyChangePct > 0 ? "+" : ""}
        {projection.weeklyChangePct}% BW)
        {projection.effectiveDeficitKcal != null && (
          <>
            {" "}
            · pace based on ~{projection.effectiveDeficitKcal} kcal/day deficit
            {projection.trainingKcalPerDay != null && (
              <> (training ~{projection.trainingKcalPerDay} kcal/day)</>
            )}
          </>
        )}
        {projection.effectiveSurplusKcal != null && (
          <>
            {" "}
            · pace based on ~{projection.effectiveSurplusKcal} kcal/day surplus
          </>
        )}{" "}
        · capped by <EvidenceRuleInline ruleId={projection.ruleId} />
      </p>

      {showGoalDate && projection.goalReachDate && goalWeightKg != null && (
        <p className="rounded-xl border border-forge-gold/30 bg-forge-gold/5 px-3 py-2 text-sm text-forge-text">
          At your current pace you&apos;ll reach{" "}
          <span className="font-semibold text-forge-gold">
            {kgToDisplayValue(goalWeightKg, unit)} {weightLabel}
          </span>{" "}
          around{" "}
          <span className="font-semibold">
            {new Date(`${projection.goalReachDate}T12:00:00`).toLocaleDateString(
              undefined,
              { month: "short", day: "numeric", year: "numeric" }
            )}
          </span>
          {projection.daysToGoal != null && (
            <span className="text-forge-muted">
              {" "}
              (~{projection.daysToGoal} days)
            </span>
          )}
          .
        </p>
      )}

      {showGoalDate && lastProjected && !projection.goalReachDate && (
        <p className="rounded-xl border border-forge-gold/30 bg-forge-gold/5 px-3 py-2 text-sm text-forge-text">
          At this pace you&apos;ll weigh{" "}
          <span className="font-semibold text-forge-gold">
            {kgToDisplayValue(lastProjected.weightKg, unit)} {weightLabel}
          </span>{" "}
          by{" "}
          <span className="font-semibold">
            {new Date(`${lastProjected.date}T12:00:00`).toLocaleDateString(
              undefined,
              { month: "short", day: "numeric", year: "numeric" }
            )}
          </span>
          .
        </p>
      )}

      <ChartShell>
        {({ width, height }) => (
          <ResponsiveContainer width={width} height={height}>
            <ComposedChart
              data={chartData}
              margin={{ top: 12, right: 12, left: 0, bottom: 4 }}
            >
              <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={formatTick}
                stroke={CHART_COLORS.muted}
                fontSize={12}
                tickMargin={8}
                minTickGap={24}
              />
              <YAxis
                stroke={CHART_COLORS.muted}
                fontSize={12}
                width={40}
                domain={["auto", "auto"]}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                contentStyle={{
                  background: CHART_COLORS.surface,
                  border: "1px solid rgba(168, 162, 158, 0.35)",
                  borderRadius: "12px",
                  color: CHART_COLORS.text,
                }}
                formatter={(value) =>
                  value != null ? [`${value} ${weightLabel}`, "Weight"] : ["—", ""]
                }
              />
              {pivotDate && (
                <ReferenceLine
                  x={pivotDate}
                  stroke={CHART_COLORS.muted}
                  strokeDasharray="4 4"
                />
              )}
              {showConfidenceBands && (
                <Area
                  type="monotone"
                  dataKey="bandRange"
                  stroke="none"
                  fill={CHART_COLORS.steel}
                  fillOpacity={0.2}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              )}
              <Line
                type="monotone"
                dataKey="actual"
                name="Logged"
                stroke={CHART_COLORS.ember}
                strokeWidth={2.5}
                dot={{ r: 3, fill: CHART_COLORS.ember, strokeWidth: 0 }}
                connectNulls={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="bridge"
                stroke={CHART_COLORS.ember}
                strokeWidth={2.5}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="projected"
                name="Projected"
                stroke={CHART_COLORS.ember}
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </ChartShell>

      {showConfidenceBands && (
        <p className="text-xs text-forge-muted">
          Shaded band = evidence min/max weekly weight change
        </p>
      )}
    </div>
  );
}
