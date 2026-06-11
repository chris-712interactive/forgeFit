import type {
  WaistProjectionResult,
  WeightProjectionResult,
} from "@forgefit/projection-engine";

const MS_PER_DAY = 86_400_000;

function parseDate(date: string): number {
  return new Date(`${date}T12:00:00Z`).getTime();
}

function daysBetween(fromDate: string, toDate: string): number {
  return (parseDate(toDate) - parseDate(fromDate)) / MS_PER_DAY;
}

function roundWaist(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Re-map waist values onto the weight projection timeline so both series share
 * the same x-axis. Extrapolation is anchored to the weight pivot so the overlay
 * spans the full projection even when the latest waist log is recent.
 */
export function alignWaistProjectionToWeightTimeline(
  waist: WaistProjectionResult,
  weight: WeightProjectionResult
): WaistProjectionResult {
  const loggedWaist = waist.points.filter((point) => !point.projected);
  const waistByDate = new Map(
    loggedWaist.map((point) => [point.date, point.waistCm])
  );
  const weightPivot = weight.points.filter((point) => !point.projected).at(-1);
  const latestLog = loggedWaist[loggedWaist.length - 1];

  if (!weightPivot || !latestLog) {
    return { ...waist, points: [] };
  }

  const dailyChangeCm = waist.weeklyChangeCm / 7;
  const waistAtPivot = roundWaist(
    latestLog.waistCm +
      dailyChangeCm * daysBetween(latestLog.date, weightPivot.date)
  );

  const points = weight.points
    .map((weightPoint) => {
      const onDateLog = waistByDate.get(weightPoint.date);
      if (onDateLog != null) {
        return {
          date: weightPoint.date,
          waistCm: onDateLog,
          projected: weightPoint.projected,
        };
      }

      const daysFromPivot = daysBetween(weightPivot.date, weightPoint.date);
      if (daysFromPivot < 0) {
        return null;
      }

      return {
        date: weightPoint.date,
        waistCm: roundWaist(waistAtPivot + dailyChangeCm * daysFromPivot),
        projected: weightPoint.projected,
      };
    })
    .filter((point): point is NonNullable<typeof point> => point != null);

  return {
    horizonDays: waist.horizonDays,
    weeklyChangeCm: waist.weeklyChangeCm,
    points,
  };
}
