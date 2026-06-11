import {
  sessionActiveMinutes,
  sessionMainWorkMinutes,
  sessionWorkingSets,
} from "./session-time";
import type { TrainingLoadSummary, WorkoutSession } from "./types";

function intensityMultiplier(setsPerActiveMinute: number): number {
  if (setsPerActiveMinute < 0.15) return 0.85;
  if (setsPerActiveMinute > 0.25) return 1.15;
  return 1.0;
}

export function computeTrainingLoad(week: WorkoutSession[]): TrainingLoadSummary {
  const sessionsPerWeek = week.length;
  const weeklyEstimatedMinutes = week.reduce(
    (sum, session) => sum + session.estimatedMinutes,
    0
  );
  const weeklyMainWorkMinutes = week.reduce(
    (sum, session) => sum + sessionMainWorkMinutes(session),
    0
  );
  const weeklyWorkingSets = week.reduce(
    (sum, session) => sum + sessionWorkingSets(session),
    0
  );
  const weeklyActiveMinutes = week.reduce(
    (sum, session) => sum + sessionActiveMinutes(session),
    0
  );

  const setsPerActiveMinute =
    weeklyActiveMinutes > 0 ? weeklyWorkingSets / weeklyActiveMinutes : 0;

  return {
    sessionsPerWeek,
    weeklyEstimatedMinutes,
    weeklyMainWorkMinutes,
    weeklyWorkingSets,
    weeklyActiveMinutes,
    intensityScore: intensityMultiplier(setsPerActiveMinute),
  };
}
