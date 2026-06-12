import type { HabitScoreInput, HabitScoreResult } from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Weekly habit score (0–100) for opt-in leaderboards. */
export function computeHabitScore(input: HabitScoreInput): HabitScoreResult {
  const windowDays = input.proteinWindowDays ?? 7;

  const trainingRatio =
    input.workoutsPlanned > 0
      ? input.workoutsCompleted / input.workoutsPlanned
      : input.workoutsCompleted > 0
        ? 1
        : 0;

  const nutritionRatio =
    windowDays > 0 ? input.proteinHitDays / windowDays : 0;

  const qualityRatio = clamp(input.qualitySessions / 4, 0, 1);

  const training = Math.round(clamp(trainingRatio, 0, 1) * 40);
  const nutrition = Math.round(clamp(nutritionRatio, 0, 1) * 35);
  const quality = Math.round(qualityRatio * 25);

  return {
    score: training + nutrition + quality,
    breakdown: { training, nutrition, quality },
  };
}
