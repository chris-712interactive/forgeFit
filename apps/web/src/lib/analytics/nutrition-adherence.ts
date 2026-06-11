import type { NutritionTargets } from "@forgefit/program-engine";
import type {
  NutritionAdherenceSummary,
  NutritionAdherenceWindow,
  NutritionDayAdherence,
} from "./types";

export interface DailyNutritionTotals {
  date: string;
  calories: number;
  proteinG: number;
}

const ADHERENCE_WINDOWS = [7, 30, 90] as const;

function withinBand(actual: number, target: number, tolerancePct = 10): boolean {
  if (target <= 0) return false;
  const low = target * (1 - tolerancePct / 100);
  const high = target * (1 + tolerancePct / 100);
  return actual >= low && actual <= high;
}

function buildDayRows(
  dailyTotals: Map<string, DailyNutritionTotals>,
  targets: NutritionTargets,
  dayCount: number
): NutritionDayAdherence[] {
  const rows: NutritionDayAdherence[] = [];
  const today = new Date();

  for (let offset = dayCount - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - offset);
    const iso = date.toISOString().slice(0, 10);
    const totals = dailyTotals.get(iso);
    const logged = totals != null;
    const proteinG = totals?.proteinG ?? 0;
    const calories = totals?.calories ?? 0;

    rows.push({
      date: iso,
      logged,
      proteinHit: logged
        ? withinBand(proteinG, targets.proteinG)
        : false,
      calorieHit: logged
        ? withinBand(calories, targets.calories)
        : false,
      proteinG,
      calories,
    });
  }

  return rows;
}

function summarizeWindow(
  days: NutritionDayAdherence[],
  windowDays: number
): NutritionAdherenceWindow {
  const slice = days.slice(-windowDays);
  const daysLogged = slice.filter((day) => day.logged).length;
  const proteinHitDays = slice.filter((day) => day.proteinHit).length;
  const calorieHitDays = slice.filter((day) => day.calorieHit).length;

  return {
    days: windowDays,
    daysLogged,
    proteinHitDays,
    calorieHitDays,
    proteinHitPct:
      windowDays > 0 ? Math.round((proteinHitDays / windowDays) * 100) : 0,
    calorieHitPct:
      windowDays > 0 ? Math.round((calorieHitDays / windowDays) * 100) : 0,
  };
}

export function buildNutritionAdherence(
  logs: DailyNutritionTotals[],
  targets: NutritionTargets | null
): NutritionAdherenceSummary | null {
  if (!targets) return null;

  const dailyTotals = new Map<string, DailyNutritionTotals>();
  for (const row of logs) {
    const existing = dailyTotals.get(row.date);
    if (!existing) {
      dailyTotals.set(row.date, { ...row });
      continue;
    }
    existing.calories += row.calories;
    existing.proteinG += row.proteinG;
  }

  const recentDays = buildDayRows(dailyTotals, targets, 90);
  const windows = ADHERENCE_WINDOWS.map((days) =>
    summarizeWindow(recentDays, days)
  );

  return {
    targets: {
      proteinG: targets.proteinG,
      calories: targets.calories,
    },
    windows,
    recentDays,
  };
}
