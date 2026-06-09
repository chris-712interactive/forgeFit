import type { ProgramPlan } from "@forgefit/program-engine";
import type { WorkoutSessionRecord } from "@/lib/workouts/sessions";
import { getWeekBounds } from "@/lib/home/weekly-stats";
import type { WeeklyAdherence } from "./types";

function isInWeek(iso: string, start: Date, end: Date): boolean {
  const time = new Date(iso).getTime();
  return time >= start.getTime() && time <= end.getTime();
}

export function sessionSetCompletionRate(session: WorkoutSessionRecord): number {
  if (session.sets.length === 0) return 1;
  const completed = session.sets.filter((set) => set.completed).length;
  return completed / session.sets.length;
}

export function sessionMeetsQuality(
  session: WorkoutSessionRecord,
  minSetCompletionPct: number
): boolean {
  return sessionSetCompletionRate(session) >= minSetCompletionPct;
}

/** Unique planned days completed in a calendar week (Mon–Sun). */
export function completedDaysInWeek(
  sessions: WorkoutSessionRecord[],
  weekStart: Date,
  weekEnd: Date,
  minSetCompletionPct: number
): number {
  const latestByDay = new Map<number, WorkoutSessionRecord>();

  for (const session of sessions) {
    if (session.status !== "completed") continue;
    if (!sessionMeetsQuality(session, minSetCompletionPct)) continue;

    const when = session.completedAt ?? session.startedAt;
    if (!isInWeek(when, weekStart, weekEnd)) continue;

    const existing = latestByDay.get(session.dayIndex);
    if (!existing) {
      latestByDay.set(session.dayIndex, session);
      continue;
    }
    const sessionTime = session.completedAt ?? session.startedAt;
    const existingTime = existing.completedAt ?? existing.startedAt;
    if (sessionTime.localeCompare(existingTime) > 0) {
      latestByDay.set(session.dayIndex, session);
    }
  }

  return latestByDay.size;
}

export function computeWeeklyAdherenceSeries(
  sessions: WorkoutSessionRecord[],
  plan: ProgramPlan | null,
  lookbackWeeks: number,
  weeklyAdherencePct: number,
  minSetCompletionPct: number,
  referenceDate = new Date()
): WeeklyAdherence[] {
  const planned = plan?.week.length ?? 0;
  if (planned === 0) return [];

  const series: WeeklyAdherence[] = [];

  for (let offset = 0; offset < lookbackWeeks; offset += 1) {
    const anchor = new Date(referenceDate);
    anchor.setDate(anchor.getDate() - offset * 7);
    const { start, end, startIso } = getWeekBounds(anchor);
    const completed = completedDaysInWeek(
      sessions,
      start,
      end,
      minSetCompletionPct
    );
    const rate = completed / planned;
    series.push({
      weekStartIso: startIso,
      completed,
      planned,
      rate,
      meetsThreshold: rate >= weeklyAdherencePct,
    });
  }

  return series.reverse();
}

export function countQualitySessionsInLookback(
  sessions: WorkoutSessionRecord[],
  lookbackWeeks: number,
  minSetCompletionPct: number,
  referenceDate = new Date()
): number {
  const oldest = new Date(referenceDate);
  oldest.setDate(oldest.getDate() - lookbackWeeks * 7);
  const { start } = getWeekBounds(oldest);

  let count = 0;
  for (const session of sessions) {
    if (session.status !== "completed") continue;
    if (!sessionMeetsQuality(session, minSetCompletionPct)) continue;
    const when = new Date(session.completedAt ?? session.startedAt);
    if (when.getTime() >= start.getTime()) count += 1;
  }
  return count;
}
