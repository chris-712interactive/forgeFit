import {
  isoWeekdayFromDate,
  parseScheduleStartIso,
  sessionKind,
  toScheduleStartIso,
} from "@forgefit/program-engine";
import type { ProgramPlan } from "@forgefit/program-engine";
import { planScheduleStartIso } from "@/lib/programs/start-date";
import {
  sessionDateIso,
  sessionMatchesScheduledPlanDay,
} from "@/lib/workouts/schedule-dates";
import type { WorkoutSessionRecord } from "./sessions";

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function yesterdayCompletedSessionKind(
  sessions: WorkoutSessionRecord[],
  referenceDate: Date
): string | undefined {
  const yesterday = new Date(referenceDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayIso = toScheduleStartIso(yesterday);

  let best: { when: string; kind: string } | undefined;
  for (const session of sessions) {
    if (session.status !== "completed") continue;
    if (sessionDateIso(session) !== yesterdayIso) continue;

    const when = session.completedAt ?? session.startedAt;
    if (!best || when.localeCompare(best.when) > 0) {
      best = { when, kind: sessionKind(session.sessionName) };
    }
  }

  return best?.kind;
}

/** Next incomplete session for this calendar week (today first, then later days). */
export function findNextPlannedSession(
  sessions: WorkoutSessionRecord[],
  plan: ProgramPlan | null,
  referenceDate = new Date()
): { dayIndex: number; name: string } | null {
  if (!plan) return null;

  const planStart = parseScheduleStartIso(planScheduleStartIso(plan));
  if (startOfDay(referenceDate) < startOfDay(planStart)) {
    return null;
  }

  const completedDays = new Set(
    sessions
      .filter((session) => session.status === "completed")
      .filter((session) =>
        sessionMatchesScheduledPlanDay(
          session,
          session.dayIndex,
          plan,
          referenceDate
        )
      )
      .map((session) => session.dayIndex)
  );
  const inProgress = sessions.find(
    (session) =>
      session.status === "in_progress" &&
      sessionMatchesScheduledPlanDay(
        session,
        session.dayIndex,
        plan,
        referenceDate
      )
  );

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
  const yesterdayKind = yesterdayCompletedSessionKind(sessions, referenceDate);

  if (todaySession) {
    if (
      yesterdayKind &&
      sessionKind(todaySession.name) === yesterdayKind
    ) {
      const alternate = [...incomplete]
        .filter(
          (session) =>
            session.dayIndex !== today &&
            sessionKind(session.name) !== yesterdayKind
        )
        .sort((a, b) => a.dayIndex - b.dayIndex)[0];
      if (alternate) {
        return { dayIndex: alternate.dayIndex, name: alternate.name };
      }
    }

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
