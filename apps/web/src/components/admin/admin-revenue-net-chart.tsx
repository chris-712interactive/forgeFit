"use client";

import { ChartShell } from "@/components/progress/chart-shell";
import { CHART_COLORS } from "@/components/progress/chart-colors";
import type { NetRevenueWeekPoint } from "@/lib/admin/revenue-metrics";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AdminRevenueNetChartProps {
  points: NetRevenueWeekPoint[];
}

function formatWeek(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function AdminRevenueNetChart({ points }: AdminRevenueNetChartProps) {
  if (points.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-forge-muted">
        Net revenue chart requires Stripe balance transactions (last 90 days).
      </div>
    );
  }

  return (
    <ChartShell height={240}>
      {({ width, height }) => (
        <ResponsiveContainer width={width} height={height}>
          <BarChart
            data={points}
            margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
          >
            <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
            <XAxis
              dataKey="weekStart"
              tickFormatter={formatWeek}
              stroke={CHART_COLORS.muted}
              fontSize={12}
            />
            <YAxis
              stroke={CHART_COLORS.muted}
              fontSize={12}
              width={56}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              contentStyle={{
                background: CHART_COLORS.surface,
                border: "1px solid rgba(168, 162, 158, 0.35)",
                borderRadius: "12px",
                color: CHART_COLORS.text,
              }}
              formatter={(value) => [formatUsd(Number(value)), "Net revenue"]}
              labelFormatter={(label) => `Week of ${formatWeek(String(label))}`}
            />
            <Bar
              dataKey="netUsd"
              fill={CHART_COLORS.steel}
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartShell>
  );
}
