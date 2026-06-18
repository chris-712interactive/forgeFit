import type { ProgramPlan } from "@forgefit/program-engine";
import type { WeeklyWorkStats } from "@/lib/home/types";
import { SLEEP_TARGET_MIN_MINUTES } from "@/lib/sleep/types";
import type {
  NutritionAdherenceSummary,
  ScorecardPillar,
  ScorecardPillarId,
  WeeklyScorecard,
} from "./types";
import type { DailySleepStats } from "@/lib/sleep/types";
import type { DailyRecoveryStats } from "@/lib/recovery/types";
import type { DailyActivityStats } from "@/lib/activity/types";

const PROTEIN_GOOD_DAYS = 5;
const PROTEIN_WATCH_DAYS = 2;
const SLEEP_TARGET_HOURS = SLEEP_TARGET_MIN_MINUTES / 60;
const AZM_WEEKLY_GOAL = 22;

const PROBLEM_PRIORITY: ScorecardPillarId[] = [
  "recovery",
  "sleep",
  "training",
  "protein",
  "activity",
];

function trainingPillar(
  plan: ProgramPlan | null,
  weeklyStats: WeeklyWorkStats
): ScorecardPillar {
  const planned = weeklyStats.workoutsPlanned;
  const completed = weeklyStats.workoutsCompleted;

  if (planned <= 0) {
    return {
      id: "training",
      label: "Training",
      summary: "No plan",
      status: "neutral",
      evidenceRuleId: "strength_training_frequency",
    };
  }

  const behind =
    completed < Math.max(1, Math.floor(planned / 2));
  const onTrack = completed >= planned || completed >= Math.ceil(planned * 0.8);

  return {
    id: "training",
    label: "Training",
    summary: `${completed}/${planned} sessions`,
    status: onTrack ? "good" : behind ? "watch" : "good",
    evidenceRuleId: plan?.isDeloadWeek
      ? "deload_intermediate"
      : "strength_training_frequency",
  };
}

function proteinPillar(
  nutritionAdherence: NutritionAdherenceSummary | null
): ScorecardPillar {
  const window = nutritionAdherence?.windows.find((row) => row.days === 7);

  if (!nutritionAdherence?.targets || !window) {
    return {
      id: "protein",
      label: "Protein",
      summary: "Log nutrition",
      status: "neutral",
      evidenceRuleId: "protein_deficit_general",
    };
  }

  const hitDays = window.proteinHitDays;
  const status =
    hitDays >= PROTEIN_GOOD_DAYS
      ? "good"
      : hitDays <= PROTEIN_WATCH_DAYS
        ? "watch"
        : "good";

  return {
    id: "protein",
    label: "Protein",
    summary: `${hitDays}/7 days on target`,
    status,
    evidenceRuleId: "protein_deficit_general",
  };
}

function sleepPillar(sleepWeekStats: DailySleepStats | null): ScorecardPillar {
  if (!sleepWeekStats || sleepWeekStats.nightsWithData === 0) {
    return {
      id: "sleep",
      label: "Sleep",
      summary: "No sleep data",
      status: "neutral",
      evidenceRuleId: "recovery_sleep",
    };
  }

  const goodNights = sleepWeekStats.nightsWithData - sleepWeekStats.shortNights;
  const status =
    sleepWeekStats.shortNights >= 3
      ? "watch"
      : goodNights >= 5 || sleepWeekStats.shortNights <= 1
        ? "good"
        : "watch";

  return {
    id: "sleep",
    label: "Sleep",
    summary: `${goodNights}/${sleepWeekStats.nightsWithData} nights ≥ ${SLEEP_TARGET_HOURS}h`,
    status,
    evidenceRuleId: "recovery_sleep",
  };
}

function recoveryPillar(
  recoveryWeekStats: DailyRecoveryStats | null
): ScorecardPillar {
  if (!recoveryWeekStats || recoveryWeekStats.daysWithData === 0) {
    return {
      id: "recovery",
      label: "Recovery",
      summary: "No HRV data",
      status: "neutral",
      evidenceRuleId: "recovery_sleep",
    };
  }

  const hrvSuppressed = recoveryWeekStats.lowHrvDays >= 3;
  const rhrElevated = recoveryWeekStats.restingHrElevated;
  const stressed = hrvSuppressed || rhrElevated;

  let summary = "On baseline";
  if (hrvSuppressed) {
    summary = `HRV down ${recoveryWeekStats.lowHrvDays} days`;
  } else if (rhrElevated) {
    summary = "Resting HR elevated";
  }

  return {
    id: "recovery",
    label: "Recovery",
    summary,
    status: stressed ? "watch" : "good",
    evidenceRuleId: "recovery_sleep",
  };
}

function activityPillar(
  activityWeekStats: DailyActivityStats | null
): ScorecardPillar {
  if (!activityWeekStats || activityWeekStats.daysWithData === 0) {
    return {
      id: "activity",
      label: "Activity",
      summary: "No activity data",
      status: "neutral",
      evidenceRuleId: "cardio_fat_loss_moderate",
    };
  }

  const azm = activityWeekStats.avgActiveZoneMinutes;
  const lowIntensity =
    activityWeekStats.lowAzmHighStepsDays >= 3 ||
    activityWeekStats.highSedentaryDays >= 3;
  const strongAzm = azm != null && azm >= AZM_WEEKLY_GOAL;

  let summary = "—";
  if (azm != null) {
    summary = `${azm} AZM avg`;
  } else if (activityWeekStats.avgSteps != null) {
    summary = `${activityWeekStats.avgSteps.toLocaleString()} steps avg`;
  }

  const status = strongAzm
    ? "good"
    : lowIntensity
      ? "watch"
      : azm != null && azm >= 10
        ? "good"
        : "watch";

  return {
    id: "activity",
    label: "Activity",
    summary,
    status,
    evidenceRuleId: "cardio_fat_loss_moderate",
  };
}

function pickHeadline(pillars: ScorecardPillar[]): {
  headline: string | null;
  problemArea: ScorecardPillarId | null;
} {
  const watchPillars = pillars.filter((pillar) => pillar.status === "watch");
  if (watchPillars.length === 0) {
    return { headline: null, problemArea: null };
  }

  for (const id of PROBLEM_PRIORITY) {
    const match = watchPillars.find((pillar) => pillar.id === id);
    if (!match) continue;

    if (match.id === "recovery") {
      return {
        headline:
          match.summary.startsWith("HRV") ? "Recovery debt" : match.summary,
        problemArea: match.id,
      };
    }

    if (match.id === "sleep") {
      return { headline: "Sleep running short", problemArea: match.id };
    }

    if (match.id === "training") {
      return { headline: "Training pace behind", problemArea: match.id };
    }

    if (match.id === "protein") {
      return { headline: "Protein consistency low", problemArea: match.id };
    }

    if (match.id === "activity") {
      return { headline: "Activity intensity low", problemArea: match.id };
    }
  }

  const first = watchPillars[0]!;
  return { headline: first.label, problemArea: first.id };
}

export function buildWeeklyScorecard(input: {
  plan: ProgramPlan | null;
  weeklyStats: WeeklyWorkStats;
  nutritionAdherence: NutritionAdherenceSummary | null;
  sleepWeekStats: DailySleepStats | null;
  recoveryWeekStats: DailyRecoveryStats | null;
  activityWeekStats: DailyActivityStats | null;
}): WeeklyScorecard {
  const pillars = [
    trainingPillar(input.plan, input.weeklyStats),
    proteinPillar(input.nutritionAdherence),
    sleepPillar(input.sleepWeekStats),
    recoveryPillar(input.recoveryWeekStats),
    activityPillar(input.activityWeekStats),
  ];

  const { headline, problemArea } = pickHeadline(pillars);
  const evidenceRuleIds = [
    ...new Set(
      pillars
        .map((pillar) => pillar.evidenceRuleId)
        .filter((ruleId): ruleId is string => ruleId != null)
    ),
  ];

  return {
    pillars,
    headline,
    problemArea,
    evidenceRuleIds,
  };
}
