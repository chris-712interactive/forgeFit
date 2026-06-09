import type { ProgramPlan } from "@forgefit/program-engine";
import type { ExperienceLevel } from "@/lib/types/profile";
import type { WorkoutSessionRecord } from "@/lib/workouts/sessions";
import {
  computeWeeklyAdherenceSeries,
  countQualitySessionsInLookback,
} from "./adherence";
import { criteriaForLevel } from "./criteria";
import type { PromotionEvaluation, PromotionProfileMeta } from "./types";

function buildDetail(
  weeksPassing: number,
  requiredWeeks: number,
  totalSessions: number,
  requiredSessions: number,
  thresholdPct: number
): string {
  return `${weeksPassing} of ${requiredWeeks} recent weeks at ${Math.round(
    thresholdPct * 100
  )}%+ adherence · ${totalSessions} quality sessions logged (need ${requiredSessions})`;
}

export function evaluatePromotion(input: {
  sessions: WorkoutSessionRecord[];
  plan: ProgramPlan | null;
  profile: PromotionProfileMeta;
  now?: Date;
}): PromotionEvaluation {
  const { sessions, plan, profile, now = new Date() } = input;
  const criteria = criteriaForLevel(profile.experienceLevel);

  if (!criteria) {
    return {
      currentLevel: profile.experienceLevel,
      nextLevel: null,
      eligible: false,
      showNudge: false,
      progress: null,
      headline: "Advanced tier unlocked",
      detail: "You're on our highest experience tier. Keep logging workouts to track progress.",
      evidenceRuleId: "experience_promotion_intermediate",
    };
  }

  const weeklyAdherence = computeWeeklyAdherenceSeries(
    sessions,
    plan,
    criteria.lookbackWeeks,
    criteria.weeklyAdherencePct,
    criteria.minSetCompletionPct,
    now
  );

  const weeksMeetingThreshold = weeklyAdherence.filter(
    (week) => week.meetsThreshold
  ).length;

  const totalQualitySessions = countQualitySessionsInLookback(
    sessions,
    criteria.lookbackWeeks,
    criteria.minSetCompletionPct,
    now
  );

  const weeksPass =
    weeksMeetingThreshold >= criteria.minWeeksPassing;
  const sessionsPass =
    totalQualitySessions >= criteria.minTotalSessions;
  const eligible = weeksPass && sessionsPass && Boolean(plan);

  const snoozed =
    profile.promotionSnoozedUntil != null &&
    new Date(profile.promotionSnoozedUntil).getTime() > now.getTime();

  const progress = {
    lookbackWeeks: criteria.lookbackWeeks,
    weeksMeetingThreshold,
    requiredWeeks: criteria.minWeeksPassing,
    adherenceThresholdPct: criteria.weeklyAdherencePct,
    totalQualitySessions,
    requiredSessions: criteria.minTotalSessions,
    weeklyAdherence,
  };

  const detail = buildDetail(
    weeksMeetingThreshold,
    criteria.minWeeksPassing,
    totalQualitySessions,
    criteria.minTotalSessions,
    criteria.weeklyAdherencePct
  );

  return {
    currentLevel: profile.experienceLevel,
    nextLevel: criteria.to,
    eligible,
    showNudge: eligible && !snoozed,
    progress,
    headline: eligible ? criteria.headlineReady : criteria.headlineProgress,
    detail,
    evidenceRuleId: criteria.evidenceRuleId,
  };
}

export function nextExperienceLevel(
  level: ExperienceLevel
): ExperienceLevel | null {
  return criteriaForLevel(level)?.to ?? null;
}
