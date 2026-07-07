import {
  parseScheduleStartIso,
  sessionKind,
  toScheduleStartIso,
  type ProgramPlan,
} from "@forgefit/program-engine";
import {
  sessionDateIso,
  sessionMatchesScheduledPlanDay,
} from "@/lib/workouts/schedule-dates";
import { planScheduleStartIso } from "@/lib/programs/start-date";
import {
  buildEffectiveScheduleMap,
  type WorkoutScheduleOverride,
} from "@/lib/workouts/schedule-overrides";
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

/** Next incomplete session using effective (adjusted) calendar dates. */
export function findNextPlannedSession(
  sessions: WorkoutSessionRecord[],
  plan: ProgramPlan | null,
  referenceDate = new Date(),
  overrides: WorkoutScheduleOverride[] = []
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

  const todayIso = toScheduleStartIso(referenceDate);
  const effectiveMap = buildEffectiveScheduleMap(plan, overrides, referenceDate);
  const sortedIncomplete = [...incomplete].sort((a, b) => {
    const aIso = effectiveMap.get(a.dayIndex) ?? "";
    const bIso = effectiveMap.get(b.dayIndex) ?? "";
    if (aIso !== bIso) return aIso.localeCompare(bIso);
    return a.dayIndex - b.dayIndex;
  });

  const todaySessions = sortedIncomplete.filter(
    (session) => effectiveMap.get(session.dayIndex) === todayIso
  );
  const yesterdayKind = yesterdayCompletedSessionKind(sessions, referenceDate);

  if (todaySessions.length > 0) {
    const primary = todaySessions[0]!;
    if (yesterdayKind && sessionKind(primary.name) === yesterdayKind) {
      const alternate = sortedIncomplete.find(
        (session) =>
          effectiveMap.get(session.dayIndex) !== todayIso &&
          sessionKind(session.name) !== yesterdayKind
      );
      if (alternate) {
        return { dayIndex: alternate.dayIndex, name: alternate.name };
      }
    }

    return { dayIndex: primary.dayIndex, name: primary.name };
  }

  const dueOrUpcoming = sortedIncomplete.filter((session) => {
    const effectiveIso = effectiveMap.get(session.dayIndex);
    return effectiveIso != null && effectiveIso <= todayIso;
  });
  if (dueOrUpcoming[0]) {
    return {
      dayIndex: dueOrUpcoming[0].dayIndex,
      name: dueOrUpcoming[0].name,
    };
  }

  const nextUp = sortedIncomplete.find((session) => {
    const effectiveIso = effectiveMap.get(session.dayIndex);
    return effectiveIso != null && effectiveIso > todayIso;
  });
  if (nextUp) {
    return { dayIndex: nextUp.dayIndex, name: nextUp.name };
  }

  const earliest = sortedIncomplete[0];
  return earliest
    ? { dayIndex: earliest.dayIndex, name: earliest.name }
    : null;
}

export function isEffectiveTrainingDay(
  plan: ProgramPlan,
  referenceDate = new Date(),
  overrides: WorkoutScheduleOverride[] = []
): boolean {
  const todayIso = toScheduleStartIso(referenceDate);
  const effectiveMap = buildEffectiveScheduleMap(plan, overrides, referenceDate);
  return plan.week.some(
    (session) => effectiveMap.get(session.dayIndex) === todayIso
  );
}
