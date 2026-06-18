"use client";

import type { DailyActivityLog } from "@/lib/activity/types";
import { useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartShell } from "@/components/progress/chart-shell";
import { CHART_COLORS } from "@/components/progress/chart-colors";

interface ActivityTrendChartProps {
  series: DailyActivityLog[];
}

function formatDay(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${Number(month)}/${Number(day)}`;
}

export function ActivityTrendChart({ series }: ActivityTrendChartProps) {
  const hasSteps = series.some((point) => point.steps != null);
  const hasAzm = series.some((point) => point.activeZoneMinutes != null);

  const chartData = useMemo(
    () =>
      series.map((point) => ({
        date: point.activityDate,
        steps: point.steps ?? 0,
        activeMinutes: point.activeMinutes ?? 0,
        activeZoneMinutes: point.activeZoneMinutes ?? 0,
      })),
    [series]
  );

  if (!hasSteps && !hasAzm) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-forge-muted">
        Connect Fitbit and sync from Profile to see your step history here.
      </div>
    );
  }

  return (
    <ChartShell>
      {({ width, height }) => (
        <ResponsiveContainer width={width} height={height}>
          <ComposedChart
            data={chartData}
            margin={{ top: 12, right: hasAzm ? 12 : 12, left: 4, bottom: 4 }}
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
              yAxisId="steps"
              stroke={CHART_COLORS.muted}
              fontSize={12}
              width={48}
            />
            {hasAzm && (
              <YAxis
                yAxisId="azm"
                orientation="right"
                stroke={CHART_COLORS.gold}
                fontSize={12}
                width={40}
              />
            )}
            <Tooltip
              contentStyle={{
                background: CHART_COLORS.surface,
                border: "1px solid rgba(168, 162, 158, 0.35)",
                borderRadius: "12px",
                color: CHART_COLORS.text,
              }}
              labelFormatter={(label) => formatDay(String(label))}
              formatter={(value, name, item) => {
                const payload = item.payload as {
                  activeMinutes?: number;
                  activeZoneMinutes?: number;
                };
                if (name === "steps") {
                  const parts = [
                    `${Number(value).toLocaleString()} steps`,
                    `${payload.activeMinutes ?? 0} active min`,
                  ];
                  if (hasAzm) {
                    parts.push(`${payload.activeZoneMinutes ?? 0} AZM`);
                  }
                  return [parts.join(" · "), "Daily activity"];
                }
                if (name === "activeZoneMinutes") {
                  return [`${Number(value)} AZM`, "Zone minutes"];
                }
                return [String(value), String(name)];
              }}
            />
            {hasSteps && (
              <Bar
                yAxisId="steps"
                dataKey="steps"
                fill={CHART_COLORS.steel}
                radius={[6, 6, 0, 0]}
                isAnimationActive={false}
              />
            )}
            {hasAzm && (
              <Line
                yAxisId="azm"
                type="monotone"
                dataKey="activeZoneMinutes"
                stroke={CHART_COLORS.gold}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </ChartShell>
  );
}
