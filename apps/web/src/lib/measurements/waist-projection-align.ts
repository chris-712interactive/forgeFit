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

/**
 * Re-map waist values onto the weight projection timeline so both series share
 * the same x-axis (avoids compressing the chart when waist history is longer).
 */
export function alignWaistProjectionToWeightTimeline(
  waist: WaistProjectionResult,
  weight: WeightProjectionResult
): WaistProjectionResult {
  const waistActual = waist.points.filter((point) => !point.projected);
  const waistByDate = new Map(
    waistActual.map((point) => [point.date, point.waistCm])
  );
  const latestWaist = waistActual[waistActual.length - 1];
  const dailyChangeCm = waist.weeklyChangeCm / 7;

  const points = weight.points
    .map((weightPoint) => {
      const loggedWaist = waistByDate.get(weightPoint.date);
      if (loggedWaist != null) {
        return {
          date: weightPoint.date,
          waistCm: loggedWaist,
          projected: false,
        };
      }

      if (!latestWaist) {
        return null;
      }

      const daysFromLatestWaist = daysBetween(
        latestWaist.date,
        weightPoint.date
      );
      if (daysFromLatestWaist < 0) {
        return null;
      }

      return {
        date: weightPoint.date,
        waistCm:
          Math.round(
            (latestWaist.waistCm + dailyChangeCm * daysFromLatestWaist) * 10
          ) / 10,
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
