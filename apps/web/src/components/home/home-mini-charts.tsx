"use client";

import { CHART_COLORS } from "@/components/progress/chart-colors";
import { ChartShell } from "@/components/progress/chart-shell";
import type { HomeChartPoint, HomeWeightPoint } from "@/lib/home/chart-snapshots";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

const MINI_HEIGHT = 88;

interface MiniSessionsChartProps {
  points: HomeChartPoint[];
}

export function MiniSessionsChart({ points }: MiniSessionsChartProps) {
  const data = points.map((point) => ({
    label: point.label,
    count: point.value ?? 0,
  }));

  return (
    <ChartShell height={MINI_HEIGHT}>
      {({ width, height }) => (
        <ResponsiveContainer width={width} height={height}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              stroke={CHART_COLORS.muted}
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              stroke={CHART_COLORS.muted}
              fontSize={10}
              width={24}
              tickLine={false}
              axisLine={false}
              domain={[0, 1]}
            />
            <Bar dataKey="count" fill={CHART_COLORS.gold} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartShell>
  );
}

interface MiniWeightChartProps {
  points: HomeWeightPoint[];
}

export function MiniWeightChart({ points }: MiniWeightChartProps) {
  const data = points
    .filter((point) => point.weightKg != null)
    .map((point) => ({
      label: point.label,
      weight: point.weightKg,
    }));

  if (data.length < 2) {
    return (
      <div
        className="flex h-[88px] items-center justify-center rounded-xl border border-dashed border-[var(--border)] px-3 text-center text-xs text-forge-muted"
        style={{ height: MINI_HEIGHT }}
      >
        Log weight on Progress to see your trend
      </div>
    );
  }

  const weights = data.map((point) => point.weight as number);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const padding = Math.max(0.5, (max - min) * 0.15);

  return (
    <ChartShell height={MINI_HEIGHT}>
      {({ width, height }) => (
        <ResponsiveContainer width={width} height={height}>
          <LineChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              stroke={CHART_COLORS.muted}
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={CHART_COLORS.muted}
              fontSize={10}
              width={32}
              tickLine={false}
              axisLine={false}
              domain={[min - padding, max + padding]}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke={CHART_COLORS.steel}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartShell>
  );
}

interface MiniStepsChartProps {
  points: HomeChartPoint[];
}

export function MiniStepsChart({ points }: MiniStepsChartProps) {
  const data = points.map((point) => ({
    label: point.label,
    steps: point.value != null ? Math.round(point.value / 1000) : 0,
  }));
  const hasData = points.some((point) => point.value != null && point.value > 0);

  if (!hasData) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-[var(--border)] px-3 text-center text-xs text-forge-muted"
        style={{ height: MINI_HEIGHT }}
      >
        Connect Fitbit to see step history
      </div>
    );
  }

  return (
    <ChartShell height={MINI_HEIGHT}>
      {({ width, height }) => (
        <ResponsiveContainer width={width} height={height}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              stroke={CHART_COLORS.muted}
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={CHART_COLORS.muted}
              fontSize={10}
              width={24}
              tickLine={false}
              axisLine={false}
            />
            <Bar dataKey="steps" fill={CHART_COLORS.steel} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartShell>
  );
}

interface MacroUsageBarsProps {
  proteinLogged: number;
  proteinTarget: number;
  caloriesLogged: number;
  calorieTarget: number;
}

export function MacroUsageBars({
  proteinLogged,
  proteinTarget,
  caloriesLogged,
  calorieTarget,
}: MacroUsageBarsProps) {
  const proteinPct =
    proteinTarget > 0 ? Math.min(100, Math.round((proteinLogged / proteinTarget) * 100)) : 0;
  const caloriePct =
    calorieTarget > 0 ? Math.min(100, Math.round((caloriesLogged / calorieTarget) * 100)) : 0;

  return (
    <div className="space-y-3">
      <MacroBar
        label="Protein"
        valueLabel={
          proteinTarget > 0
            ? `${Math.round(proteinLogged)} / ${Math.round(proteinTarget)}g`
            : `${Math.round(proteinLogged)}g`
        }
        pct={proteinPct}
        barClassName="bg-forge-coral"
      />
      {calorieTarget > 0 && (
        <MacroBar
          label="Calories"
          valueLabel={`${Math.round(caloriesLogged).toLocaleString()} / ${Math.round(calorieTarget).toLocaleString()}`}
          pct={caloriePct}
          barClassName="bg-forge-ember"
        />
      )}
    </div>
  );
}

function MacroBar({
  label,
  valueLabel,
  pct,
  barClassName,
}: {
  label: string;
  valueLabel: string;
  pct: number;
  barClassName: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-forge-muted">
          {label}
        </p>
        <p className="text-[10px] tabular-nums text-forge-muted">{valueLabel}</p>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-forge-surface">
        <div className={`h-full rounded-full ${barClassName}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
