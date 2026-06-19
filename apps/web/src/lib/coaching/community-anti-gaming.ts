import type { WorkoutSessionRecord } from "@/lib/workouts/sessions";

export interface ScoreFlagEvaluationInput {
  habitScore: number;
  workoutsCompleted: number;
  workoutsPlanned: number;
  proteinHitDays: number;
  nutritionLogDays: number;
  qualitySessions: number;
  previousWeekScore: number | null;
  sessions: WorkoutSessionRecord[];
}

export interface ScoreFlagResult {
  flagged: boolean;
  reason: string | null;
}

export function evaluateScoreFlags(
  input: ScoreFlagEvaluationInput
): ScoreFlagResult {
  if (
    input.habitScore >= 95 &&
    input.workoutsPlanned > 0 &&
    input.workoutsCompleted === 0
  ) {
    return {
      flagged: true,
      reason: "Near-perfect score without completed workouts",
    };
  }

  if (
    input.proteinHitDays >= 6 &&
    input.nutritionLogDays <= 2 &&
    input.habitScore >= 70
  ) {
    return {
      flagged: true,
      reason: "Protein streak inconsistent with nutrition logs",
    };
  }

  if (
    input.previousWeekScore != null &&
    input.habitScore - input.previousWeekScore >= 45
  ) {
    return {
      flagged: true,
      reason: "Unusual week-over-week score jump",
    };
  }

  const duplicateBurst = findDuplicateSessionBurst(input.sessions);
  if (duplicateBurst) {
    return {
      flagged: true,
      reason: duplicateBurst,
    };
  }

  if (
    input.habitScore >= 98 &&
    input.qualitySessions === 0 &&
    input.workoutsCompleted >= 3
  ) {
    return {
      flagged: true,
      reason: "High score without quality sessions",
    };
  }

  return { flagged: false, reason: null };
}

function findDuplicateSessionBurst(
  sessions: WorkoutSessionRecord[]
): string | null {
  const recent = sessions
    .filter((session) => session.completedAt)
    .slice(0, 40);

  const byMinute = new Map<string, number>();
  for (const session of recent) {
    const completedAt = new Date(session.completedAt!);
    const bucket = `${completedAt.toISOString().slice(0, 16)}:${session.dayIndex}`;
    const count = (byMinute.get(bucket) ?? 0) + 1;
    byMinute.set(bucket, count);
    if (count >= 3) {
      return "Multiple workouts logged in the same minute";
    }
  }

  return null;
}
