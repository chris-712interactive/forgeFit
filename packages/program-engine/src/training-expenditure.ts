import { sessionActiveMinutes } from "./session-time";
import type {
  ProgramUserProfile,
  TrainingExpenditure,
  TrainingLoadSummary,
  WorkoutSession,
} from "./types";

const RESISTANCE_MET = 5;
const KCAL_PER_MIN_FLOOR = 4;
const KCAL_PER_MIN_CEILING = 8;

export function grossKcalPerMinute(weightKg: number): number {
  const metBased = 0.0175 * RESISTANCE_MET * weightKg;
  return Math.max(KCAL_PER_MIN_FLOOR, Math.min(KCAL_PER_MIN_CEILING, metBased));
}

function sessionTrainingKcal(
  session: WorkoutSession,
  weightKg: number,
  intensityScore: number
): number {
  const activeMinutes = sessionActiveMinutes(session);
  return Math.round(
    activeMinutes * grossKcalPerMinute(weightKg) * intensityScore
  );
}

export function estimateTrainingExpenditure(
  week: WorkoutSession[],
  load: TrainingLoadSummary,
  profile: ProgramUserProfile
): TrainingExpenditure {
  const weeklyTrainingKcal = week.reduce(
    (sum, session) =>
      sum +
      sessionTrainingKcal(session, profile.weightKg, load.intensityScore),
    0
  );

  return {
    weeklyTrainingKcal,
    dailyTrainingKcal: Math.round(weeklyTrainingKcal / 7),
    ruleId: "training_eee_resistance",
  };
}
