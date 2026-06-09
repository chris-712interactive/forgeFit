import { resolveExerciseDetail } from "@forgefit/exercise-db";
import type { ExperienceLevel } from "@/lib/types/profile";
import type { WorkoutSessionRecord, WorkoutSetRecord } from "@/lib/workouts/sessions";
import type {
  BuildLoadProgressionInput,
  ExerciseLoadProgression,
  LoadProgressionAction,
} from "./load-progression-types";

const LOOKBACK_DAYS = 42;
const EASY_RIR = 3;
const HARD_RIR = 0;

const WEIGHT_INCREASE_PCT: Record<ExperienceLevel, number> = {
  beginner: 0.025,
  intermediate: 0.05,
  advanced: 0.05,
};

const MAX_EXTRA_SETS = 1;
const MUSCLE_EASY_SET_THRESHOLD = 4;

export function parseTargetReps(reps: string): number {
  const matches = reps.match(/\d+/g);
  if (!matches?.length) return 8;
  return Math.max(...matches.map(Number));
}

function roundWeightKg(kg: number): number {
  return Math.round(kg * 2) / 2;
}

function muscleKey(exerciseId: string): string | null {
  const detail = resolveExerciseDetail(exerciseId);
  if (!detail?.primaryMuscles.length) return null;
  return detail.primaryMuscles[0]?.toLowerCase() ?? null;
}

function sessionTime(session: WorkoutSessionRecord): string {
  return session.completedAt ?? session.startedAt;
}

function recentCompletedSessions(
  sessions: WorkoutSessionRecord[],
  referenceDate: Date
): WorkoutSessionRecord[] {
  const cutoff = new Date(referenceDate);
  cutoff.setDate(cutoff.getDate() - LOOKBACK_DAYS);

  return [...sessions]
    .filter((session) => {
      if (session.status !== "completed") return false;
      return new Date(sessionTime(session)).getTime() >= cutoff.getTime();
    })
    .sort((a, b) => sessionTime(b).localeCompare(sessionTime(a)));
}

function workingSets(sets: WorkoutSetRecord[]): WorkoutSetRecord[] {
  return sets.filter(
    (set) =>
      set.completed &&
      set.reps != null &&
      set.reps > 0 &&
      (set.weightKg != null || set.rir != null)
  );
}

function averageRir(sets: WorkoutSetRecord[]): number | undefined {
  const withRir = sets.filter((set) => set.rir != null);
  if (withRir.length === 0) return undefined;
  return (
    withRir.reduce((sum, set) => sum + (set.rir ?? 0), 0) / withRir.length
  );
}

function bestWeightKg(sets: WorkoutSetRecord[]): number | undefined {
  const weights = sets
    .map((set) => set.weightKg)
    .filter((value): value is number => value != null && value > 0);
  if (weights.length === 0) return undefined;
  return Math.max(...weights);
}

function bestReps(sets: WorkoutSetRecord[]): number | undefined {
  const reps = sets
    .map((set) => set.reps)
    .filter((value): value is number => value != null && value > 0);
  if (reps.length === 0) return undefined;
  return Math.max(...reps);
}

function findExerciseHistory(
  exerciseId: string,
  sessions: WorkoutSessionRecord[]
): WorkoutSessionRecord[] {
  return sessions.filter((session) =>
    workingSets(
      session.sets.filter((set) => set.exerciseId === exerciseId)
    ).length > 0
  );
}

function countConsecutiveEasySessions(
  exerciseId: string,
  sessions: WorkoutSessionRecord[]
): number {
  let count = 0;
  for (const session of sessions) {
    const sets = workingSets(
      session.sets.filter((set) => set.exerciseId === exerciseId)
    );
    if (sets.length === 0) break;
    const avg = averageRir(sets);
    if (avg == null || avg < EASY_RIR) break;
    count += 1;
  }
  return count;
}

function decideAction(avgRir: number | undefined): LoadProgressionAction {
  if (avgRir == null) return "hold";
  if (avgRir >= EASY_RIR) return "increase_weight";
  if (avgRir <= HARD_RIR) return "ease";
  return "hold";
}

function buildSameExerciseProgression(
  exerciseId: string,
  targetReps: string,
  history: WorkoutSessionRecord[],
  experienceLevel: ExperienceLevel
): ExerciseLoadProgression | null {
  const latest = history[0];
  if (!latest) return null;

  const sets = workingSets(
    latest.sets.filter((set) => set.exerciseId === exerciseId)
  );
  if (sets.length === 0) return null;

  const avgRir = averageRir(sets);
  const lastWeight = bestWeightKg(sets);
  const lastReps = bestReps(sets);
  const action = decideAction(avgRir);
  const easyStreak = countConsecutiveEasySessions(exerciseId, history);
  const parsedTarget = parseTargetReps(targetReps);

  if (action === "ease") {
    const easedWeight =
      lastWeight != null
        ? roundWeightKg(lastWeight * 0.95)
        : undefined;
    return {
      exerciseId,
      suggestedWeightKg: easedWeight,
      suggestedReps: lastReps ?? parsedTarget,
      extraSets: 0,
      action: "ease",
      basedOn: "same_exercise",
      lastAvgRir: avgRir,
      reason:
        "Last time felt near limit — same load today, focus on clean reps.",
    };
  }

  if (action === "hold") {
    return {
      exerciseId,
      suggestedWeightKg: lastWeight,
      suggestedReps: lastReps ?? parsedTarget,
      extraSets: 0,
      action: "hold",
      basedOn: "same_exercise",
      lastAvgRir: avgRir,
      reason: "Solid effort last time — match or beat those numbers.",
    };
  }

  // Easy — progress load
  let suggestedWeightKg = lastWeight;
  let suggestedReps = lastReps ?? parsedTarget;
  let progressionAction: LoadProgressionAction = "increase_weight";
  let reason = "You had reps in reserve — bump the weight slightly.";

  if (lastWeight != null) {
    suggestedWeightKg = roundWeightKg(
      lastWeight * (1 + WEIGHT_INCREASE_PCT[experienceLevel])
    );
    if (suggestedWeightKg <= lastWeight) {
      suggestedWeightKg = roundWeightKg(lastWeight + 0.5);
    }
    suggestedReps = lastReps ?? parsedTarget;
  } else {
    progressionAction = "increase_reps";
    suggestedReps = (lastReps ?? parsedTarget) + 1;
    reason = "Bodyweight work felt easy — add a rep per set if you can.";
  }

  let extraSets = 0;
  if (easyStreak >= 2 && lastWeight != null) {
    extraSets = MAX_EXTRA_SETS;
    reason =
      "Two easy sessions in a row — slight weight bump and one extra working set.";
  }

  return {
    exerciseId,
    suggestedWeightKg,
    suggestedReps,
    extraSets,
    action: extraSets > 0 ? "add_set" : progressionAction,
    basedOn: "same_exercise",
    lastAvgRir: avgRir,
    reason,
  };
}

function buildMuscleSignals(
  sessions: WorkoutSessionRecord[]
): Map<string, { easySets: number; avgRir: number }> {
  const signals = new Map<string, { easySets: number; rirTotal: number }>();

  for (const session of sessions) {
    for (const set of workingSets(session.sets)) {
      if (set.rir == null || set.rir < EASY_RIR) continue;
      const key = muscleKey(set.exerciseId);
      if (!key) continue;
      const current = signals.get(key) ?? { easySets: 0, rirTotal: 0 };
      current.easySets += 1;
      current.rirTotal += set.rir;
      signals.set(key, current);
    }
  }

  const result = new Map<string, { easySets: number; avgRir: number }>();
  for (const [key, value] of signals) {
    result.set(key, {
      easySets: value.easySets,
      avgRir: value.rirTotal / value.easySets,
    });
  }
  return result;
}

function buildMuscleGroupProgression(
  exerciseId: string,
  targetReps: string,
  muscleSignals: Map<string, { easySets: number; avgRir: number }>
): ExerciseLoadProgression | null {
  const key = muscleKey(exerciseId);
  if (!key) return null;

  const signal = muscleSignals.get(key);
  if (!signal || signal.easySets < MUSCLE_EASY_SET_THRESHOLD) return null;

  const parsedTarget = parseTargetReps(targetReps);
  return {
    exerciseId,
    suggestedReps: parsedTarget + 1,
    extraSets: 0,
    action: "increase_reps",
    basedOn: "muscle_group",
    lastAvgRir: signal.avgRir,
    reason: `Your ${key.replace(/_/g, " ")} work has been running easy — aim for an extra rep today.`,
  };
}

export function buildSessionLoadProgressions(
  input: BuildLoadProgressionInput
): Map<string, ExerciseLoadProgression> {
  const {
    exercises,
    sessions,
    experienceLevel,
    referenceDate = new Date(),
  } = input;

  const recent = recentCompletedSessions(sessions, referenceDate);
  const muscleSignals = buildMuscleSignals(recent);
  const progressions = new Map<string, ExerciseLoadProgression>();

  for (const exercise of exercises) {
    const history = findExerciseHistory(exercise.exerciseId, recent);
    const direct = buildSameExerciseProgression(
      exercise.exerciseId,
      exercise.reps,
      history,
      experienceLevel
    );

    if (direct) {
      progressions.set(exercise.exerciseId, direct);
      continue;
    }

    const muscle = buildMuscleGroupProgression(
      exercise.exerciseId,
      exercise.reps,
      muscleSignals
    );
    if (muscle) {
      progressions.set(exercise.exerciseId, muscle);
    }
  }

  return progressions;
}

export function progressionToPrefill(
  progression: ExerciseLoadProgression
): { weightKg?: number; reps?: number } {
  return {
    weightKg: progression.suggestedWeightKg,
    reps: progression.suggestedReps,
  };
}
