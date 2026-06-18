"use client";

import type { DailyRecoveryLog } from "@/lib/recovery/types";
import {
  formatHrvMs,
  formatRestingHr,
  recoveryMidpoint,
} from "@/lib/recovery/format";
import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartShell } from "@/components/progress/chart-shell";
import { CHART_COLORS } from "@/components/progress/chart-colors";

interface RecoveryTrendChartProps {
  series: DailyRecoveryLog[];
}

function formatDay(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${Number(month)}/${Number(day)}`;
}

export function RecoveryTrendChart({ series }: RecoveryTrendChartProps) {
  const chartData = useMemo(
    () =>
      series.map((point) => ({
        date: point.recoveryDate,
        restingHr: recoveryMidpoint(point.restingHrMin, point.restingHrMax),
        hrvMs: recoveryMidpoint(point.hrvMsMin, point.hrvMsMax),
      })),
    [series]
  );

  const hasData = series.some(hasRecoveryMetrics);

  if (!hasData) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-forge-muted">
        Connect Fitbit and sync from Profile to see resting HR and HRV trends.
      </div>
    );
  }

  return (
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
              tickFormatter={formatDay}
              stroke={CHART_COLORS.muted}
              fontSize={12}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="rhr"
              stroke={CHART_COLORS.muted}
              fontSize={12}
              width={36}
              domain={["auto", "auto"]}
            />
            <YAxis
              yAxisId="hrv"
              orientation="right"
              stroke={CHART_COLORS.muted}
              fontSize={12}
              width={40}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                background: CHART_COLORS.surface,
                border: "1px solid rgba(168, 162, 158, 0.35)",
                borderRadius: "12px",
                color: CHART_COLORS.text,
              }}
              labelFormatter={(label) => formatDay(String(label))}
              formatter={(value, name) => {
                if (name === "restingHr") {
                  return [formatRestingHr(Number(value)), "Resting HR"];
                }
                return [formatHrvMs(Number(value)), "HRV"];
              }}
            />
            <Legend />
            <Line
              yAxisId="rhr"
              type="monotone"
              dataKey="restingHr"
              name="Resting HR"
              stroke={CHART_COLORS.steel}
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
              connectNulls
            />
            <Line
              yAxisId="hrv"
              type="monotone"
              dataKey="hrvMs"
              name="HRV"
              stroke={CHART_COLORS.ember}
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartShell>
  );
}

function hasRecoveryMetrics(log: DailyRecoveryLog): boolean {
  return (
    log.restingHrMin != null ||
    log.restingHrMax != null ||
    log.hrvMsMin != null ||
    log.hrvMsMax != null
  );
}
