"use client";

import { useUnitPreference } from "@/components/units/unit-preference-provider";
import {
  kgToDisplayValue,
  weightUnitLabel,
} from "@/lib/units/measurements";
import type { LiftStrengthSeries } from "@/lib/analytics/types";
import { useMemo, useState } from "react";
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

interface StrengthProgressionChartProps {
  series: LiftStrengthSeries[];
}

function formatTick(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

export function StrengthProgressionChart({
  series,
}: StrengthProgressionChartProps) {
  const unit = useUnitPreference();
  const weightLabel = weightUnitLabel(unit);
  const [activeId, setActiveId] = useState(series[0]?.exerciseId ?? "");

  const activeSeries = useMemo(
    () => series.find((item) => item.exerciseId === activeId) ?? series[0],
    [activeId, series]
  );

  const chartData = useMemo(() => {
    if (!activeSeries) return [];
    return activeSeries.points.map((point) => ({
      date: point.date,
      e1rm: kgToDisplayValue(point.e1rmKg, unit),
    }));
  }, [activeSeries, unit]);

  if (series.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-forge-muted">
        Log working sets on compound lifts to see estimated 1RM trends.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {series.map((item) => (
          <button
            key={item.exerciseId}
            type="button"
            onClick={() => setActiveId(item.exerciseId)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeId === item.exerciseId
                ? "bg-forge-ember text-white"
                : "border border-[var(--border)] text-forge-muted hover:text-forge-text"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

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
              />
              <YAxis
                stroke={CHART_COLORS.muted}
                fontSize={12}
                width={44}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  background: CHART_COLORS.surface,
                  border: "1px solid rgba(168, 162, 158, 0.35)",
                  borderRadius: "12px",
                  color: CHART_COLORS.text,
                }}
                formatter={(value) =>
                  value != null ? [`${value} ${weightLabel} e1RM`, ""] : ["—", ""]
                }
              />
              <Line
                type="monotone"
                dataKey="e1rm"
                stroke={CHART_COLORS.gold}
                strokeWidth={2.5}
                dot={{ r: 3, fill: CHART_COLORS.gold, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartShell>
    </div>
  );
}
