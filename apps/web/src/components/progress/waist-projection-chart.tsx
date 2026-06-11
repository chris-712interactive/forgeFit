"use client";

import { useUnitPreference } from "@/components/units/unit-preference-provider";
import {
  cmToDisplayValue,
  lengthUnitLabel,
} from "@/lib/units/measurements";
import type { WaistProjectionResult } from "@forgefit/projection-engine";
import { useMemo } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartShell } from "./chart-shell";
import { CHART_COLORS } from "./chart-colors";

interface WaistProjectionChartProps {
  projection: WaistProjectionResult | null;
  showGoalDate?: boolean;
}

function formatTick(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function paddedDomain(values: number[]): [number, number] {
  if (values.length === 0) return [0, 100];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    const pad = Math.max(1, min * 0.05);
    return [Math.round((min - pad) * 10) / 10, Math.round((max + pad) * 10) / 10];
  }
  const pad = Math.max((max - min) * 0.15, 0.5);
  return [
    Math.round((min - pad) * 10) / 10,
    Math.round((max + pad) * 10) / 10,
  ];
}

export function WaistProjectionChart({
  projection,
  showGoalDate = false,
}: WaistProjectionChartProps) {
  const unit = useUnitPreference();
  const lengthLabel = lengthUnitLabel(unit);

  const chartData = useMemo(() => {
    if (!projection) return [];

    const actual = projection.points.filter((point) => !point.projected);
    const pivotDate = actual[actual.length - 1]?.date;

    return projection.points.map((point) => ({
      date: point.date,
      actual: point.projected
        ? null
        : cmToDisplayValue(point.waistCm, unit),
      projected: point.projected
        ? cmToDisplayValue(point.waistCm, unit)
        : null,
      bridge:
        point.date === pivotDate
          ? cmToDisplayValue(point.waistCm, unit)
          : null,
    }));
  }, [projection, unit]);

  const yDomain = useMemo(
    () =>
      paddedDomain(
        chartData.flatMap((row) =>
          [row.actual, row.projected, row.bridge].filter(
            (value): value is number => value != null
          )
        )
      ),
    [chartData]
  );

  if (!projection) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-forge-muted">
        Log waist on at least two dates to generate a projection.
      </div>
    );
  }

  const actual = projection.points.filter((point) => !point.projected);
  const pivotDate = actual[actual.length - 1]?.date;
  const lastProjected = projection.points.filter((point) => point.projected).at(-1);
  const weeklySign = projection.weeklyChangeCm > 0 ? "+" : "";

  return (
    <div className="space-y-3">
      <p className="text-sm text-forge-muted">
        Trend pace:{" "}
        <span className="font-medium text-forge-steel">
          {weeklySign}
          {cmToDisplayValue(projection.weeklyChangeCm, unit)} {lengthLabel}/week
        </span>{" "}
        from your logged measurements
      </p>

      {showGoalDate && lastProjected && (
        <p className="rounded-xl border border-forge-steel/30 bg-forge-steel/5 px-3 py-2 text-sm text-forge-text">
          At this pace your waist will be around{" "}
          <span className="font-semibold text-forge-steel">
            {cmToDisplayValue(lastProjected.waistCm, unit)} {lengthLabel}
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
                stroke={CHART_COLORS.steel}
                fontSize={12}
                width={40}
                domain={yDomain}
                tickFormatter={(value) => `${value}`}
                label={{
                  value: lengthLabel,
                  angle: -90,
                  position: "insideLeft",
                  fill: CHART_COLORS.steel,
                  fontSize: 11,
                }}
              />
              <Tooltip
                contentStyle={{
                  background: CHART_COLORS.surface,
                  border: "1px solid rgba(168, 162, 158, 0.35)",
                  borderRadius: "12px",
                  color: CHART_COLORS.text,
                }}
                formatter={(value) =>
                  value != null ? [`${value} ${lengthLabel}`, "Waist"] : ["—", ""]
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
                stroke={CHART_COLORS.steel}
                strokeWidth={2.5}
                dot={{ r: 4, fill: CHART_COLORS.steel, strokeWidth: 0 }}
                connectNulls={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="bridge"
                stroke={CHART_COLORS.steel}
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
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </ChartShell>

      <p className="text-xs text-forge-muted">
        Solid line = logged waist · dashed = linear trend projection
      </p>
    </div>
  );
}
