import type { MeasurementMetric, TrendSeries } from "./types";

export interface BodyMeasurementRow {
  measuredDate: string;
  weightKg?: number | null;
  waistCm?: number | null;
  chestCm?: number | null;
  armsCm?: number | null;
  legsCm?: number | null;
  neckCm?: number | null;
  hipsCm?: number | null;
  bodyFatPct?: number | null;
}

const METRIC_CONFIG: Record<
  MeasurementMetric,
  { label: string; unit: string; field: keyof BodyMeasurementRow }
> = {
  weightKg: { label: "Weight", unit: "kg", field: "weightKg" },
  waistCm: { label: "Waist", unit: "cm", field: "waistCm" },
  chestCm: { label: "Chest", unit: "cm", field: "chestCm" },
  armsCm: { label: "Arms", unit: "cm", field: "armsCm" },
  legsCm: { label: "Legs", unit: "cm", field: "legsCm" },
  neckCm: { label: "Neck", unit: "cm", field: "neckCm" },
  hipsCm: { label: "Hips", unit: "cm", field: "hipsCm" },
  bodyFatPct: { label: "Body fat", unit: "%", field: "bodyFatPct" },
};

export function buildTrendSeries(
  rows: BodyMeasurementRow[],
  metrics: MeasurementMetric[] = ["weightKg", "waistCm"]
): TrendSeries[] {
  const sorted = [...rows].sort((a, b) =>
    a.measuredDate.localeCompare(b.measuredDate)
  );

  return metrics
    .map((metric) => {
      const config = METRIC_CONFIG[metric];
      const points = sorted
        .map((row) => {
          const raw = row[config.field];
          const value = raw == null ? null : Number(raw);
          if (value == null || Number.isNaN(value)) return null;
          return { date: row.measuredDate, value };
        })
        .filter((point): point is { date: string; value: number } => point != null);

      return {
        metric,
        label: config.label,
        unit: config.unit,
        points,
      };
    })
    .filter((series) => series.points.length > 0);
}
