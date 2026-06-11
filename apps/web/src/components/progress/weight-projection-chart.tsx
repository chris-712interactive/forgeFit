"use client";

import { useUnitPreference } from "@/components/units/unit-preference-provider";
import {
  cmToDisplayValue,
  kgToDisplayValue,
  lengthUnitLabel,
  weightUnitLabel,
} from "@/lib/units/measurements";
import type {
  WaistProjectionResult,
  WeightProjectionResult,
} from "@forgefit/projection-engine";
import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EvidenceRuleInline } from "@/components/evidence/evidence-rule-inline";
import { ChartShell } from "./chart-shell";
import { CHART_COLORS } from "./chart-colors";

interface WeightProjectionChartProps {
  projection: WeightProjectionResult | null;
  waistProjection?: WaistProjectionResult | null;
  showConfidenceBands?: boolean;
  showGoalDate?: boolean;
}

function formatTick(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

export function WeightProjectionChart({
  projection,
  waistProjection = null,
  showConfidenceBands = false,
  showGoalDate = false,
}: WeightProjectionChartProps) {
  const unit = useUnitPreference();
  const weightLabel = weightUnitLabel(unit);
  const lengthLabel = lengthUnitLabel(unit);
  const showWaistOverlay = waistProjection != null;

  const chartData = useMemo(() => {
    if (!projection) return [];

    const weightByDate = new Map(
      projection.points.map((point) => [point.date, point])
    );
    const waistByDate = new Map(
      waistProjection?.points.map((point) => [point.date, point]) ?? []
    );

    const dates = [
      ...new Set([...weightByDate.keys(), ...waistByDate.keys()]),
    ].sort();

    const weightActual = projection.points.filter((point) => !point.projected);
    const weightPivotDate = weightActual[weightActual.length - 1]?.date;
    const waistActual = waistProjection?.points.filter((point) => !point.projected) ?? [];
    const waistPivotDate = waistActual[waistActual.length - 1]?.date;

    return dates.map((date) => {
      const point = weightByDate.get(date);
      const waistPoint = waistByDate.get(date);

      return {
        date,
        actual:
          point && !point.projected
            ? kgToDisplayValue(point.weightKg, unit)
            : null,
        projected:
          point && point.projected
            ? kgToDisplayValue(point.weightKg, unit)
            : null,
        bridge:
          point && date === weightPivotDate
            ? kgToDisplayValue(point.weightKg, unit)
            : null,
        bandRange:
          showConfidenceBands &&
          point &&
          point.bandLowKg != null &&
          point.bandHighKg != null
            ? [
                kgToDisplayValue(point.bandLowKg, unit),
                kgToDisplayValue(point.bandHighKg, unit),
              ]
            : null,
        waistActual:
          waistPoint && !waistPoint.projected
            ? cmToDisplayValue(waistPoint.waistCm, unit)
            : null,
        waistProjected:
          waistPoint && waistPoint.projected
            ? cmToDisplayValue(waistPoint.waistCm, unit)
            : null,
        waistBridge:
          waistPoint && date === waistPivotDate
            ? cmToDisplayValue(waistPoint.waistCm, unit)
            : null,
      };
    });
  }, [projection, waistProjection, showConfidenceBands, unit]);

  if (!projection) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-forge-muted">
        Add weight entries to generate a projection.
      </div>
    );
  }

  const weightActual = projection.points.filter((point) => !point.projected);
  const pivotDate = weightActual[weightActual.length - 1]?.date;
  const weeklyDisplay = kgToDisplayValue(
    Math.abs(projection.weeklyChangeKg),
    unit
  );
  const weeklySign = projection.weeklyChangeKg > 0 ? "+" : "-";
  const lastProjected = projection.points.filter((point) => point.projected).at(-1);
  const lastWaistProjected = waistProjection?.points
    .filter((point) => point.projected)
    .at(-1);

  return (
    <div className="space-y-3">
      <p className="text-sm text-forge-muted">
        Trend pace:{" "}
        <span className="font-medium text-forge-gold">
          {weeklySign}
          {weeklyDisplay} {weightLabel}/week
        </span>{" "}
        ({projection.weeklyChangePct > 0 ? "+" : ""}
        {projection.weeklyChangePct}% BW)
        {projection.effectiveDeficitKcal != null && (
          <>
            {" "}
            · pace based on ~{projection.effectiveDeficitKcal} kcal/day deficit
            {projection.trainingKcalPerDay != null && (
              <> (training ~{projection.trainingKcalPerDay} kcal/day)</>
            )}
          </>
        )}
        {projection.effectiveSurplusKcal != null && (
          <>
            {" "}
            · pace based on ~{projection.effectiveSurplusKcal} kcal/day surplus
          </>
        )}{" "}
        · capped by <EvidenceRuleInline ruleId={projection.ruleId} />
      </p>

      {showWaistOverlay && waistProjection && (
        <p className="text-sm text-forge-muted">
          Waist pace:{" "}
          <span className="font-medium text-forge-steel">
            {waistProjection.weeklyChangeCm > 0 ? "+" : ""}
            {cmToDisplayValue(waistProjection.weeklyChangeCm, unit)} {lengthLabel}
            /week
          </span>{" "}
          from your logged measurements
        </p>
      )}

      {showGoalDate && lastProjected && (
        <p className="rounded-xl border border-forge-gold/30 bg-forge-gold/5 px-3 py-2 text-sm text-forge-text">
          At this pace you&apos;ll weigh{" "}
          <span className="font-semibold text-forge-gold">
            {kgToDisplayValue(lastProjected.weightKg, unit)} {weightLabel}
          </span>{" "}
          by{" "}
          <span className="font-semibold">
            {new Date(`${lastProjected.date}T12:00:00`).toLocaleDateString(
              undefined,
              { month: "short", day: "numeric", year: "numeric" }
            )}
          </span>
          {showWaistOverlay && lastWaistProjected && (
            <>
              {" "}
              with waist around{" "}
              <span className="font-semibold text-forge-steel">
                {cmToDisplayValue(lastWaistProjected.waistCm, unit)} {lengthLabel}
              </span>
            </>
          )}
          .
        </p>
      )}

      <ChartShell>
        {({ width, height }) => (
          <ResponsiveContainer width={width} height={height}>
            <ComposedChart
              data={chartData}
              margin={{
                top: 12,
                right: showWaistOverlay ? 48 : 12,
                left: 4,
                bottom: 4,
              }}
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
                yAxisId="weight"
                stroke={CHART_COLORS.muted}
                fontSize={12}
                width={44}
                domain={["auto", "auto"]}
                tickFormatter={(value) => `${value}`}
              />
              {showWaistOverlay && (
                <YAxis
                  yAxisId="waist"
                  orientation="right"
                  stroke={CHART_COLORS.steel}
                  fontSize={12}
                  width={44}
                  domain={["auto", "auto"]}
                  tickFormatter={(value) => `${value}`}
                />
              )}
              <Tooltip
                contentStyle={{
                  background: CHART_COLORS.surface,
                  border: "1px solid rgba(168, 162, 158, 0.35)",
                  borderRadius: "12px",
                  color: CHART_COLORS.text,
                }}
                formatter={(value, name) => {
                  if (value == null) return ["—", ""];
                  if (name === "waistActual" || name === "waistProjected") {
                    return [`${value} ${lengthLabel}`, "Waist"];
                  }
                  return [`${value} ${weightLabel}`, "Weight"];
                }}
              />
              {pivotDate && (
                <ReferenceLine
                  x={pivotDate}
                  yAxisId="weight"
                  stroke={CHART_COLORS.muted}
                  strokeDasharray="4 4"
                />
              )}
              {showConfidenceBands && (
                <Area
                  yAxisId="weight"
                  type="monotone"
                  dataKey="bandRange"
                  stroke="none"
                  fill={CHART_COLORS.steel}
                  fillOpacity={0.2}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              )}
              <Line
                yAxisId="weight"
                type="monotone"
                dataKey="actual"
                name="Logged weight"
                stroke={CHART_COLORS.ember}
                strokeWidth={2.5}
                dot={{ r: 3, fill: CHART_COLORS.ember, strokeWidth: 0 }}
                connectNulls={false}
                isAnimationActive={false}
              />
              <Line
                yAxisId="weight"
                type="monotone"
                dataKey="bridge"
                stroke={CHART_COLORS.ember}
                strokeWidth={2.5}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
              <Line
                yAxisId="weight"
                type="monotone"
                dataKey="projected"
                name="Projected weight"
                stroke={CHART_COLORS.ember}
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
              {showWaistOverlay && (
                <>
                  <Line
                    yAxisId="waist"
                    type="monotone"
                    dataKey="waistActual"
                    name="waistActual"
                    stroke={CHART_COLORS.steel}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: CHART_COLORS.steel, strokeWidth: 0 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="waist"
                    type="monotone"
                    dataKey="waistBridge"
                    stroke={CHART_COLORS.steel}
                    strokeWidth={2.5}
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="waist"
                    type="monotone"
                    dataKey="waistProjected"
                    name="waistProjected"
                    stroke={CHART_COLORS.steel}
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={false}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </ChartShell>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-forge-muted">
        <span>
          <span
            className="mr-1.5 inline-block h-0.5 w-4 align-middle"
            style={{ background: CHART_COLORS.ember }}
          />
          Weight ({weightLabel})
        </span>
        {showWaistOverlay && (
          <span>
            <span
              className="mr-1.5 inline-block h-0.5 w-4 align-middle border-b border-dashed"
              style={{ borderColor: CHART_COLORS.steel, background: CHART_COLORS.steel }}
            />
            Waist ({lengthLabel})
          </span>
        )}
        {showConfidenceBands && (
          <span>Shaded band = evidence min/max weekly weight change</span>
        )}
      </div>
    </div>
  );
}
