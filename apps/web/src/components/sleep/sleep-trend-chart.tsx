"use client";

import type { DailySleepLog } from "@/lib/sleep/types";
import { formatSleepHours } from "@/lib/sleep/format";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartShell } from "@/components/progress/chart-shell";
import { CHART_COLORS } from "@/components/progress/chart-colors";
import { SLEEP_TARGET_MIN_MINUTES } from "@/lib/sleep/types";

interface SleepTrendChartProps {
  series: DailySleepLog[];
}

function formatDay(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${Number(month)}/${Number(day)}`;
}

export function SleepTrendChart({ series }: SleepTrendChartProps) {
  const chartData = useMemo(
    () =>
      series.map((point) => ({
        date: point.sleepDate,
        hours: point.durationMinutes != null ? point.durationMinutes / 60 : 0,
      })),
    [series]
  );

  const hasData = series.some(
    (point) => point.durationMinutes != null && point.durationMinutes > 0
  );

  if (!hasData) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-forge-muted">
        Connect Fitbit and sync from Profile to see sleep history here.
      </div>
    );
  }

  const targetHours = SLEEP_TARGET_MIN_MINUTES / 60;

  return (
    <ChartShell>
      {({ width, height }) => (
        <ResponsiveContainer width={width} height={height}>
          <BarChart
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
              stroke={CHART_COLORS.muted}
              fontSize={12}
              width={40}
              tickFormatter={(value) => `${value}h`}
            />
            <ReferenceLine
              y={targetHours}
              stroke={CHART_COLORS.gold}
              strokeDasharray="4 4"
              label={{
                value: "7h target",
                position: "insideTopRight",
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
              labelFormatter={(label) => formatDay(String(label))}
              formatter={(value) => [
                formatSleepHours(Number(value) * 60),
                "Sleep",
              ]}
            />
            <Bar
              dataKey="hours"
              fill={CHART_COLORS.ember}
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartShell>
  );
}
