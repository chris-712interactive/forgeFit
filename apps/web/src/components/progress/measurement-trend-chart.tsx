"use client";

import { useUnitPreference } from "@/components/units/unit-preference-provider";
import {
  kgToDisplayValue,
  weightUnitLabel,
} from "@/lib/units/measurements";
import type { TrendSeries } from "@forgefit/projection-engine";
import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartShell } from "./chart-shell";
import { CHART_COLORS } from "./chart-colors";

interface MeasurementTrendChartProps {
  series: TrendSeries[];
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
    const pad = Math.max(2, min * 0.05);
    return [Math.round((min - pad) * 10) / 10, Math.round((max + pad) * 10) / 10];
  }
  const pad = Math.max((max - min) * 0.15, 1);
  return [
    Math.round((min - pad) * 10) / 10,
    Math.round((max + pad) * 10) / 10,
  ];
}

export function MeasurementTrendChart({ series }: MeasurementTrendChartProps) {
  const unit = useUnitPreference();
  const weightLabel = weightUnitLabel(unit);

  const weightSeries = useMemo(
    () => series.find((item) => item.metric === "weightKg") ?? null,
    [series]
  );

  const chartData = useMemo(() => {
    if (!weightSeries) return [];
    return weightSeries.points.map((point) => ({
      date: point.date,
      weight: kgToDisplayValue(point.value, unit),
    }));
  }, [weightSeries, unit]);

  const yDomain = useMemo(
    () => paddedDomain(chartData.map((row) => row.weight)),
    [chartData]
  );

  if (!weightSeries || chartData.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-forge-muted">
        Log weight to see your trend.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {chartData.length === 1 && (
        <p className="text-xs text-forge-muted">
          One entry logged — add another date to draw a trend line.
        </p>
      )}
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
                domain={yDomain}
                tickFormatter={(value) => `${value}`}
                label={{
                  value: weightLabel,
                  angle: -90,
                  position: "insideLeft",
                  fill: CHART_COLORS.muted,
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
                formatter={(value) => [`${value} ${weightLabel}`, "Weight"]}
                labelFormatter={(label) => String(label)}
              />
              <Line
                type="monotone"
                dataKey="weight"
                name={`Weight (${weightLabel})`}
                stroke={CHART_COLORS.ember}
                strokeWidth={2.5}
                dot={{ r: 4, fill: CHART_COLORS.ember, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartShell>
    </div>
  );
}
