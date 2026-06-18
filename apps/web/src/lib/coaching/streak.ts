import { getWeekBounds } from "@/lib/home/weekly-stats";
import { completedDaysInWeek } from "@/lib/progression/adherence";
import type { ProgramPlan } from "@forgefit/program-engine";
import type { WorkoutSessionRecord } from "@/lib/workouts/sessions";

export const TRAINING_STREAK_MILESTONES = [4, 8, 12, 26, 52] as const;

/** Consecutive calendar weeks (Mon–Sun) meeting the planned workout count. */
export function computeTrainingStreakWeeks(
  sessions: WorkoutSessionRecord[],
  plan: ProgramPlan | null,
  referenceDate = new Date()
): number {
  const planned = plan?.week.length ?? 0;
  if (planned === 0) return 0;

  let streak = 0;

  for (let offset = 0; offset < 52; offset += 1) {
    const anchor = new Date(referenceDate);
    anchor.setDate(anchor.getDate() - offset * 7);
    const { start, end } = getWeekBounds(anchor);
    const completed = completedDaysInWeek(sessions, start, end, 0.5);
    const metPlan = completed >= planned;

    if (offset === 0 && !metPlan) {
      continue;
    }

    if (metPlan) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

export function highestNewStreakMilestone(
  streakWeeks: number,
  publishedMilestones: number[]
): number | null {
  const published = new Set(publishedMilestones);
  let found: number | null = null;

  for (const milestone of TRAINING_STREAK_MILESTONES) {
    if (streakWeeks >= milestone && !published.has(milestone)) {
      found = milestone;
    }
  }

  return found;
}
