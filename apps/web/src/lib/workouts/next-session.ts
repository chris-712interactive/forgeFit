import { isoWeekdayFromDate } from "@forgefit/program-engine";
import type { ProgramPlan } from "@forgefit/program-engine";
import type { WorkoutSessionRecord } from "./sessions";

/** Next incomplete session for this calendar week (today first, then later days). */
export function findNextPlannedSession(
  sessions: WorkoutSessionRecord[],
  plan: ProgramPlan | null,
  referenceDate = new Date()
): { dayIndex: number; name: string } | null {
  if (!plan) return null;

  const completedDays = new Set(
    sessions
      .filter((session) => session.status === "completed")
      .map((session) => session.dayIndex)
  );
  const inProgress = sessions.find((session) => session.status === "in_progress");

  if (inProgress) {
    return {
      dayIndex: inProgress.dayIndex,
      name: inProgress.sessionName,
    };
  }

  const incomplete = plan.week.filter(
    (session) => !completedDays.has(session.dayIndex)
  );
  if (incomplete.length === 0) return null;

  const today = isoWeekdayFromDate(referenceDate);
  const todaySession = incomplete.find((session) => session.dayIndex === today);
  if (todaySession) {
    return { dayIndex: todaySession.dayIndex, name: todaySession.name };
  }

  const laterThisWeek = incomplete
    .filter((session) => session.dayIndex > today)
    .sort((a, b) => a.dayIndex - b.dayIndex);
  if (laterThisWeek[0]) {
    return {
      dayIndex: laterThisWeek[0].dayIndex,
      name: laterThisWeek[0].name,
    };
  }

  const earliest = [...incomplete].sort((a, b) => a.dayIndex - b.dayIndex)[0];
  return earliest
    ? { dayIndex: earliest.dayIndex, name: earliest.name }
    : null;
}
