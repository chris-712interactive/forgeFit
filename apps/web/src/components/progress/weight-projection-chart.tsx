"use client";

import { useUnitPreference } from "@/components/units/unit-preference-provider";
import {
  kgToDisplayValue,
  weightUnitLabel,
} from "@/lib/units/measurements";
import type { WeightProjectionResult } from "@forgefit/projection-engine";
import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
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
}

function formatTick(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

export function WeightProjectionChart({ projection }: WeightProjectionChartProps) {
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
    }));
  }, [projection, unit]);

  if (!projection) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-forge-muted">
        Add weight entries to generate a 30-day projection.
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

  return (
    <div className="space-y-3">
      <p className="text-sm text-forge-muted">
        Trend pace:{" "}
        <span className="font-medium text-forge-gold">
          {weeklySign}
          {weeklyDisplay} {weightLabel}/week
        </span>{" "}
        ({projection.weeklyChangePct > 0 ? "+" : ""}
        {projection.weeklyChangePct}% BW) · capped by{" "}
        <EvidenceRuleInline ruleId={projection.ruleId} />
      </p>

      <ChartShell>
        {({ width, height }) => (
          <ResponsiveContainer width={width} height={height}>
            <LineChart
              data={chartData}
              margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
            >
              <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={formatTick}
                stroke={CHART_COLORS.muted}
                fontSize={12}
                tickMargin={8}
              />
              <YAxis
                stroke={CHART_COLORS.muted}
                fontSize={12}
                width={44}
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
                  value != null ? [`${value} ${weightLabel}`, ""] : ["—", ""]
                }
              />
              {pivotDate && (
                <ReferenceLine
                  x={pivotDate}
                  stroke={CHART_COLORS.muted}
                  strokeDasharray="4 4"
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
                stroke={CHART_COLORS.steel}
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartShell>
    </div>
  );
}
