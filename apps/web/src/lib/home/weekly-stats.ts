import { timedSetTotalMs } from "@forgefit/exercise-db";
import type { ProgramPlan } from "@forgefit/program-engine";
import { recoveryMinutesLogged } from "@/lib/workouts/recovery";
import type { WorkoutSessionRecord } from "@/lib/workouts/sessions";
import type { WeeklyWorkStats } from "./types";

const CARDIO_PATTERN =
  /treadmill|walk|run|jog|bike|cycle|elliptical|rower|swim|cardio|incline|stair|recumbent|air_bike/i;

export function getWeekBounds(date = new Date()) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + diff);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return {
    start,
    end,
    startIso: start.toISOString().slice(0, 10),
    endIso: end.toISOString().slice(0, 10),
  };
}

function isInWeek(iso: string, start: Date, end: Date): boolean {
  const time = new Date(iso).getTime();
  return time >= start.getTime() && time <= end.getTime();
}

function isCardioExercise(exerciseId: string, exerciseName: string): boolean {
  return CARDIO_PATTERN.test(`${exerciseId} ${exerciseName}`);
}

function cardioMilesPerMinute(exerciseId: string, exerciseName: string): number {
  const label = `${exerciseId} ${exerciseName}`.toLowerCase();
  if (/swim/.test(label)) return 1.5 / 60;
  if (/run|jog/.test(label)) return 6 / 60;
  if (/row|rower|rowing/.test(label)) return 9 / 60;
  if (/bike|cycle|recumbent|air_bike/.test(label)) return 12 / 60;
  if (/walk|treadmill|incline|stair|elliptical/.test(label)) return 3.5 / 60;
  return 4 / 60;
}

function parseReps(reps?: string | number): number {
  if (reps == null) return 0;
  if (typeof reps === "number") return Number.isFinite(reps) ? reps : 0;
  const match = reps.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function sessionMinutes(session: WorkoutSessionRecord): number {
  if (!session.completedAt) return 0;
  const ms =
    new Date(session.completedAt).getTime() -
    new Date(session.startedAt).getTime();
  return Math.max(1, Math.round(ms / 60_000));
}

export function computeWeeklyWorkStats(
  sessions: WorkoutSessionRecord[],
  plan: ProgramPlan | null,
  referenceDate = new Date()
): WeeklyWorkStats {
  const { start, end } = getWeekBounds(referenceDate);
  const planned = plan?.week.length ?? 0;

  const completedThisWeek = sessions.filter(
    (session) =>
      session.status === "completed" &&
      isInWeek(session.completedAt ?? session.startedAt, start, end)
  );

  const latestCompletedByDay = new Map<number, WorkoutSessionRecord>();
  for (const session of completedThisWeek) {
    const existing = latestCompletedByDay.get(session.dayIndex);
    if (!existing) {
      latestCompletedByDay.set(session.dayIndex, session);
      continue;
    }
    const sessionTime = session.completedAt ?? session.startedAt;
    const existingTime = existing.completedAt ?? existing.startedAt;
    if (sessionTime.localeCompare(existingTime) > 0) {
      latestCompletedByDay.set(session.dayIndex, session);
    }
  }

  const sessionsForStats = [...latestCompletedByDay.values()];

  let totalVolumeKg = 0;
  let totalSets = 0;
  let cardioMinutes = 0;
  let estimatedDistanceMiles = 0;
  let recoveryMinutes = 0;
  let trainingMinutes = 0;

  for (const session of sessionsForStats) {
    trainingMinutes += sessionMinutes(session);

    const planSession = plan?.week.find((s) => s.dayIndex === session.dayIndex);
    recoveryMinutes += recoveryMinutesLogged({
      recoveryStatus: session.recoveryStatus,
      recoveryDurationMs: session.recoveryDurationMs,
      recoveryBlock: session.recoveryBlock ?? planSession?.recoveryBlock,
      plannedRecoveryMinutes: planSession?.recoveryBlock?.durationMinutes,
    });

    const completedSets = session.sets.filter((set) => set.completed);
    totalSets += completedSets.length;

    for (const set of completedSets) {
      if (isCardioExercise(set.exerciseId, set.exerciseName)) {
        const totalMs = timedSetTotalMs(set, set.exerciseId);
        const minutes =
          totalMs != null
            ? Math.max(1, Math.round(totalMs / 60_000))
            : Math.max(1, parseReps(set.reps));
        cardioMinutes += minutes;
        estimatedDistanceMiles +=
          minutes * cardioMilesPerMinute(set.exerciseId, set.exerciseName);
        continue;
      }

      const reps = parseReps(set.reps);
      if (set.weightKg != null && reps > 0) {
        totalVolumeKg += set.weightKg * reps;
      }
    }
  }

  return {
    workoutsCompleted: latestCompletedByDay.size,
    workoutsPlanned: planned,
    totalVolumeKg: Math.round(totalVolumeKg),
    totalSets,
    cardioMinutes,
    estimatedDistanceMiles: Math.round(estimatedDistanceMiles * 10) / 10,
    recoveryMinutes,
    trainingMinutes,
  };
}

export { findNextPlannedSession } from "@/lib/workouts/next-session";
