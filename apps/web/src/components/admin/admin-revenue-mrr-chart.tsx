"use client";

import { ChartShell } from "@/components/progress/chart-shell";
import { CHART_COLORS } from "@/components/progress/chart-colors";
import type { RevenueSnapshotPoint } from "@/lib/admin/revenue-snapshots";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AdminRevenueMrrChartProps {
  points: RevenueSnapshotPoint[];
}

function formatDate(iso: string): string {
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

export function AdminRevenueMrrChart({ points }: AdminRevenueMrrChartProps) {
  if (points.length < 2) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-forge-muted">
        MRR trend builds from daily snapshots. Check back after a few days of
        admin revenue page visits.
      </div>
    );
  }

  const chartData = points.map((point) => ({
    date: point.snapshotDate,
    mrrUsd: point.mrrUsd,
    paidSubscribers: point.paidSubscribers,
  }));

  return (
    <ChartShell height={240}>
      {({ width, height }) => (
        <ResponsiveContainer width={width} height={height}>
          <LineChart
            data={chartData}
            margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
          >
            <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
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
              formatter={(value, name) => {
                if (name === "mrrUsd") {
                  return [formatUsd(Number(value)), "MRR"];
                }
                return [String(value), "Paid subs"];
              }}
              labelFormatter={(label) => formatDate(String(label))}
            />
            <Line
              type="monotone"
              dataKey="mrrUsd"
              stroke={CHART_COLORS.ember}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartShell>
  );
}
