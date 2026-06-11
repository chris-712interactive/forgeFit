"use client";

import { useUnitPreference } from "@/components/units/unit-preference-provider";
import { kgToDisplayValue } from "@/lib/units/measurements";
import type { MuscleVolumeSlice, WeeklyVolumePoint } from "@/lib/analytics/types";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartShell } from "./chart-shell";
import { CHART_COLORS } from "./chart-colors";

interface VolumeTrendChartProps {
  weeklyVolume: WeeklyVolumePoint[];
  muscleVolume: MuscleVolumeSlice[];
}

function formatWeek(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${Number(month)}/${Number(day)}`;
}

export function VolumeTrendChart({
  weeklyVolume,
  muscleVolume,
}: VolumeTrendChartProps) {
  const unit = useUnitPreference();

  const chartData = useMemo(
    () =>
      weeklyVolume.map((point) => ({
        week: point.weekStart,
        volume: kgToDisplayValue(point.volumeKg, unit),
        sessions: point.sessions,
      })),
    [weeklyVolume, unit]
  );

  if (weeklyVolume.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-forge-muted">
        Complete logged strength sessions to see weekly volume trends.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ChartShell>
        {({ width, height }) => (
          <ResponsiveContainer width={width} height={height}>
            <BarChart
              data={chartData}
              margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
            >
              <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
              <XAxis
                dataKey="week"
                tickFormatter={formatWeek}
                stroke={CHART_COLORS.muted}
                fontSize={12}
              />
              <YAxis stroke={CHART_COLORS.muted} fontSize={12} width={48} />
              <Tooltip
                contentStyle={{
                  background: CHART_COLORS.surface,
                  border: "1px solid rgba(168, 162, 158, 0.35)",
                  borderRadius: "12px",
                  color: CHART_COLORS.text,
                }}
                formatter={(value, _name, item) => {
                  const payload = item.payload as { sessions?: number };
                  return [
                    `${value} · ${payload.sessions ?? 0} sessions`,
                    "Weekly volume",
                  ];
                }}
              />
              <Bar
                dataKey="volume"
                fill={CHART_COLORS.ember}
                radius={[6, 6, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartShell>

      {muscleVolume.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-forge-muted">
            Top muscle groups (period)
          </p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {muscleVolume.map((slice) => (
              <li
                key={slice.muscle}
                className="flex items-center justify-between gap-3 capitalize"
              >
                <span className="text-forge-muted">
                  {slice.muscle.replace(/_/g, " ")}
                </span>
                <span className="font-medium text-forge-text">
                  {kgToDisplayValue(slice.volumeKg, unit).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
