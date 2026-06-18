import type { ProgramPlan } from "@forgefit/program-engine";
import type { BodyMeasurementRow } from "@/lib/measurements/types";
import type { WorkoutSessionRecord } from "@/lib/workouts/sessions";
import { getWeekBounds } from "@/lib/home/weekly-stats";
import type {
  LiftStrengthSeries,
  NutritionAdherenceSummary,
  RuleInsight,
  WeeklyVolumePoint,
} from "./types";
import type { DailySleepStats } from "@/lib/sleep/types";
import type { DailyRecoveryStats } from "@/lib/recovery/types";
import { SLEEP_TARGET_MIN_MINUTES } from "@/lib/sleep/types";

function weightChangeKg(
  measurements: BodyMeasurementRow[],
  lookbackDays: number
): number | null {
  const withWeight = measurements
    .filter((row) => row.weightKg != null && row.weightKg > 0)
    .sort((a, b) => a.measuredDate.localeCompare(b.measuredDate));

  if (withWeight.length < 2) return null;

  const latest = withWeight[withWeight.length - 1]!;
  const cutoff = new Date(`${latest.measuredDate}T12:00:00`);
  cutoff.setDate(cutoff.getDate() - lookbackDays);
  const cutoffIso = cutoff.toISOString().slice(0, 10);

  const baseline = withWeight.find((row) => row.measuredDate >= cutoffIso);
  if (!baseline?.weightKg || !latest.weightKg) return null;

  return latest.weightKg - baseline.weightKg;
}

function sessionsCompletedThisWeek(sessions: WorkoutSessionRecord[]): number {
  const { start, end } = getWeekBounds();
  return sessions.filter(
    (session) =>
      session.status === "completed" &&
      new Date(session.completedAt ?? session.startedAt).getTime() >=
        start.getTime() &&
      new Date(session.completedAt ?? session.startedAt).getTime() <=
        end.getTime()
  ).length;
}

function liftTrendPct(series: LiftStrengthSeries, lookbackDays: number): number | null {
  if (series.points.length < 2) return null;

  const latest = series.points[series.points.length - 1]!;
  const cutoff = new Date(`${latest.date}T12:00:00`);
  cutoff.setDate(cutoff.getDate() - lookbackDays);
  const cutoffIso = cutoff.toISOString().slice(0, 10);

  const baseline = series.points.find((point) => point.date >= cutoffIso);
  if (!baseline || baseline.e1rmKg <= 0) return null;

  return ((latest.e1rmKg - baseline.e1rmKg) / baseline.e1rmKg) * 100;
}

export function buildRuleInsights(input: {
  measurements: BodyMeasurementRow[];
  sessions: WorkoutSessionRecord[];
  plan: ProgramPlan | null;
  strengthSeries: LiftStrengthSeries[];
  weeklyVolume: WeeklyVolumePoint[];
  nutritionAdherence: NutritionAdherenceSummary | null;
  sleepWeekStats: DailySleepStats | null;
  recoveryWeekStats: DailyRecoveryStats | null;
}): RuleInsight[] {
  const insights: RuleInsight[] = [];

  if (input.plan?.isDeloadWeek) {
    insights.push({
      id: "deload_active",
      tone: "neutral",
      title: "Deload week in progress",
      body: "Your plan reduced volume ~40% this week. Keep reps easy — this supports recovery before the next training block.",
    });

    const recovery = input.recoveryWeekStats;
    if (
      recovery &&
      recovery.restingHrElevated &&
      recovery.daysWithData >= 3
    ) {
      insights.push({
        id: "rhr_elevated_deload",
        tone: "nudge",
        title: "Resting heart rate is elevated",
        body: `Your 7-day average resting HR is above your recent baseline during a deload week. Prioritize sleep and easy movement — elevated RHR can mean accumulated fatigue.`,
      });
    }
  }

  const weightDelta21 = weightChangeKg(input.measurements, 21);
  if (weightDelta21 != null && Math.abs(weightDelta21) < 0.5) {
    insights.push({
      id: "weight_plateau",
      tone: "nudge",
      title: "Weight trend has flattened",
      body: "Change over the last 3 weeks is under 0.5 kg. Plateaus are common — check session consistency and protein before changing calories.",
    });
  }

  const planned = input.plan?.week.length ?? 0;
  const completed = sessionsCompletedThisWeek(input.sessions);
  if (planned > 0 && completed < Math.max(1, Math.floor(planned / 2))) {
    insights.push({
      id: "sessions_behind",
      tone: "nudge",
      title: "Training pace is behind plan",
      body: `You've logged ${completed} of ${planned} planned sessions this week. Projections assume you hit your weekly session target.`,
    });
  }

  const proteinWindow = input.nutritionAdherence?.windows.find(
    (window) => window.days === 7
  );
  if (proteinWindow) {
    if (proteinWindow.proteinHitDays >= 5) {
      insights.push({
        id: "protein_strong",
        tone: "positive",
        title: "Protein consistency is strong",
        body: `You hit your protein target ${proteinWindow.proteinHitDays} of the last 7 days. That supports muscle retention during your current goal.`,
      });
    } else if (proteinWindow.proteinHitDays <= 2) {
      insights.push({
        id: "protein_low",
        tone: "nudge",
        title: "Protein target missed most days",
        body: `Only ${proteinWindow.proteinHitDays} of the last 7 days were within range. Evidence rules prioritize protein during fat loss and hypertrophy.`,
      });
    }
  }

  const mainLift = input.strengthSeries.find(
    (series) => series.exerciseId === "barbell_squat"
  ) ?? input.strengthSeries[0];

  if (mainLift) {
    const trend = liftTrendPct(mainLift, 28);
    if (trend != null && trend >= 2) {
      insights.push({
        id: "strength_up",
        tone: "positive",
        title: `${mainLift.label} is trending up`,
        body: `Estimated 1RM is up ~${Math.round(trend)}% over the last 4 weeks based on logged work.`,
      });
    }
  }

  if (input.weeklyVolume.length >= 2) {
    const current = input.weeklyVolume[input.weeklyVolume.length - 1]!;
    const prior = input.weeklyVolume[input.weeklyVolume.length - 2]!;
    const volumeUp =
      prior.volumeKg > 0 && current.volumeKg > prior.volumeKg * 1.1;

    if (volumeUp) {
      insights.push({
        id: "volume_up",
        tone: "positive",
        title: "Training volume climbed this week",
        body: `You moved ${current.volumeKg.toLocaleString()} kg vs ${prior.volumeKg.toLocaleString()} kg last week — progressive overload is showing up in the logs.`,
      });
    }

    const recovery = input.recoveryWeekStats;
    if (
      volumeUp &&
      recovery &&
      recovery.daysWithData >= 3 &&
      recovery.lowHrvDays >= 3
    ) {
      insights.push({
        id: "hrv_suppressed_volume",
        tone: "nudge",
        title: "HRV is down while volume climbed",
        body: `Training load increased this week and HRV ran below your baseline on ${recovery.lowHrvDays} of the last ${recovery.daysWithData} logged days. Consider an extra rest day or keeping accessory work lighter.`,
      });
    }
  }

  const sleep = input.sleepWeekStats;
  if (
    sleep &&
    sleep.nightsWithData >= 3 &&
    sleep.shortNights >= 3
  ) {
    const avgHours =
      sleep.avgDurationMinutes != null
        ? (sleep.avgDurationMinutes / 60).toFixed(1)
        : null;
    insights.push({
      id: "sleep_short",
      tone: "nudge",
      title: "Sleep is running short",
      body: `${sleep.shortNights} of the last ${sleep.nightsWithData} logged nights were under ${SLEEP_TARGET_MIN_MINUTES / 60} hours${
        avgHours ? ` (7-day avg ${avgHours}h)` : ""
      }. Recovery rules target 7–9 hours — short sleep often shows up as missed sessions or stalled progress.`,
    });
  }

  return insights.slice(0, 4);
}
