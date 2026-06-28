import { grossKcalPerMinute } from "./training-expenditure";

export interface LoggedSetSummary {
  completed: boolean;
  durationMs?: number;
}

export interface LoggedSessionSummary {
  status: string;
  startedAt: string;
  completedAt: string | null;
  sets: LoggedSetSummary[];
  warmupDurationMs?: number;
  recoveryDurationMs?: number;
}

const DEFAULT_INTENSITY = 1;

function completedRepSets(sets: LoggedSetSummary[]): number {
  return sets.filter((set) => set.completed && set.durationMs == null).length;
}

function completedHoldMinutes(sets: LoggedSetSummary[]): number {
  return sets
    .filter((set) => set.completed && set.durationMs != null)
    .reduce((sum, set) => sum + (set.durationMs ?? 0) / 60_000, 0);
}

export function estimateLoggedSessionActiveMinutes(
  session: LoggedSessionSummary
): number {
  const completedSets = session.sets.filter((set) => set.completed);
  if (completedSets.length === 0) return 0;

  const repSets = completedRepSets(completedSets);
  const holdMinutes = completedHoldMinutes(completedSets);
  const warmupMinutes = (session.warmupDurationMs ?? 0) / 60_000;
  const recoveryMinutes = (session.recoveryDurationMs ?? 0) / 60_000 * 0.3;

  const workMinutes = repSets * 0.75 + holdMinutes;
  const restMinutes = repSets * 2;
  const estimated = workMinutes + restMinutes + warmupMinutes + recoveryMinutes;

  if (session.completedAt && session.startedAt) {
    const wallMinutes =
      (new Date(session.completedAt).getTime() -
        new Date(session.startedAt).getTime()) /
      60_000;
    if (wallMinutes >= 8 && wallMinutes <= 180) {
      return Math.round(Math.max(estimated, Math.min(wallMinutes, estimated * 1.15)));
    }
  }

  return Math.round(Math.max(5, estimated));
}

export function estimateLoggedSessionKcal(
  session: LoggedSessionSummary,
  weightKg: number,
  intensityScore = DEFAULT_INTENSITY
): number {
  if (session.status !== "completed") return 0;

  const activeMinutes = estimateLoggedSessionActiveMinutes(session);
  if (activeMinutes <= 0) return 0;

  return Math.round(
    activeMinutes * grossKcalPerMinute(weightKg) * intensityScore
  );
}

export function sumLoggedSessionsKcal(
  sessions: LoggedSessionSummary[],
  weightKg: number,
  intensityScore = DEFAULT_INTENSITY
): number {
  return sessions.reduce(
    (sum, session) =>
      sum + estimateLoggedSessionKcal(session, weightKg, intensityScore),
    0
  );
}
