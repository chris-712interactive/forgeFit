import {
  isDurationHoldExercise,
  resolveExerciseDetail,
  resolveHoldPrescription,
} from "@forgefit/exercise-db";
import type { ExperienceLevel, FitnessGoal } from "@/lib/types/profile";
import type { WorkoutSessionRecord, WorkoutSetRecord } from "@/lib/workouts/sessions";
import type {
  BuildLoadProgressionInput,
  ExerciseLoadProgression,
  LoadProgressionAction,
} from "./load-progression-types";
import { snapPrescribedWeightKg } from "./load-snapping";
import {
  buildExerciseE1rmMap,
  clampWeightToE1rmBand,
  mergeEffectiveE1rmMap,
  percent1rmForReps,
  roundWeightKg,
  starterLoadKg,
  workingWeightFromE1rm,
  type EffectiveE1rmEntry,
} from "./one-rep-max";
import type { UnitSystem } from "@/lib/types/profile";

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

function holdWorkingSets(sets: WorkoutSetRecord[]): WorkoutSetRecord[] {
  return sets.filter(
    (set) => set.completed && set.reps != null && set.reps > 0
  );
}

function findExerciseHistory(
  exerciseId: string,
  sessions: WorkoutSessionRecord[]
): WorkoutSessionRecord[] {
  const filterSets = isDurationHoldExercise(exerciseId)
    ? holdWorkingSets
    : workingSets;

  return sessions.filter((session) =>
    filterSets(
      session.sets.filter((set) => set.exerciseId === exerciseId)
    ).length > 0
  );
}

function buildDurationHoldProgression(
  exerciseId: string,
  targetReps: string,
  history: WorkoutSessionRecord[],
  experienceLevel: ExperienceLevel
): ExerciseLoadProgression {
  const prescription = resolveHoldPrescription(
    exerciseId,
    targetReps,
    experienceLevel
  );
  const parsedTarget = parseTargetReps(prescription);
  const latest = history[0];

  if (!latest) {
    return {
      exerciseId,
      suggestedReps: parsedTarget,
      extraSets: 0,
      action: "hold",
      basedOn: "prescription",
      reason: `Aim for ${prescription} per set. Log how long you held.`,
    };
  }

  const sets = holdWorkingSets(
    latest.sets.filter((set) => set.exerciseId === exerciseId)
  );
  const avgRir = averageRir(sets);
  const lastSeconds = bestReps(sets) ?? parsedTarget;
  const action = decideAction(avgRir);

  if (action === "ease") {
    return {
      exerciseId,
      suggestedReps: Math.max(15, Math.round(lastSeconds * 0.9)),
      extraSets: 0,
      action: "ease",
      basedOn: "same_exercise",
      lastAvgRir: avgRir,
      reason: "Last hold felt maxed out — aim for a slightly shorter, cleaner hold.",
    };
  }

  if (action === "hold") {
    return {
      exerciseId,
      suggestedReps: lastSeconds,
      extraSets: 0,
      action: "hold",
      basedOn: "same_exercise",
      lastAvgRir: avgRir,
      reason: `Match or beat your last hold (~${lastSeconds} sec).`,
    };
  }

  return {
    exerciseId,
    suggestedReps: lastSeconds + 5,
    extraSets: 0,
    action: "increase_reps",
    basedOn: "same_exercise",
    lastAvgRir: avgRir,
    reason: "Last hold felt easy — add a few seconds if form stays solid.",
  };
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

function applyE1rmGuardrails(
  progression: ExerciseLoadProgression,
  e1rmKg: number | undefined,
  targetReps: string,
  goal: FitnessGoal
): ExerciseLoadProgression {
  if (e1rmKg == null || progression.suggestedWeightKg == null) {
    return progression;
  }

  const reps = progression.suggestedReps ?? parseTargetReps(targetReps);
  const clamped = clampWeightToE1rmBand(
    progression.suggestedWeightKg,
    e1rmKg,
    reps,
    goal
  );
  const pct = percent1rmForReps(reps, goal);

  return {
    ...progression,
    suggestedWeightKg: clamped,
    estimatedE1rmKg: e1rmKg,
    loadPercent1rm: pct,
    reason: `${progression.reason} (~${Math.round(pct * 100)}% est. 1RM for ${reps} reps).`,
  };
}

function e1rmReasonPrefix(entry: EffectiveE1rmEntry): string {
  if (entry.source === "user_declared") {
    return "Your entered 1RM";
  }
  if (entry.source === "blended") {
    return "Updated max from your logs (above profile 1RM)";
  }
  return "Estimated max from your logs";
}

function buildE1rmBasedProgression(
  exerciseId: string,
  targetReps: string,
  entry: EffectiveE1rmEntry,
  goal: FitnessGoal
): ExerciseLoadProgression {
  const reps = parseTargetReps(targetReps);
  const weight = workingWeightFromE1rm(entry.e1rmKg, reps, goal, 2);
  const pct = percent1rmForReps(reps, goal);

  return {
    exerciseId,
    suggestedWeightKg: weight,
    suggestedReps: reps,
    extraSets: 0,
    action: "hold",
    basedOn:
      entry.source === "user_declared" ? "user_declared_1rm" : "estimated_1rm",
    estimatedE1rmKg: entry.e1rmKg,
    loadPercent1rm: pct,
    reason: `${e1rmReasonPrefix(entry)} ~${roundWeightKg(entry.e1rmKg)} kg — aim for ${reps} reps at ~${Math.round(pct * 100)}% with 1–2 reps in reserve.`,
  };
}

function buildStarterProgression(
  exerciseId: string,
  targetReps: string,
  bodyweightKg: number,
  experienceLevel: ExperienceLevel
): ExerciseLoadProgression | null {
  const weight = starterLoadKg(exerciseId, bodyweightKg, experienceLevel);
  if (weight == null) return null;

  const reps = parseTargetReps(targetReps);
  return {
    exerciseId,
    suggestedWeightKg: weight,
    suggestedReps: reps,
    extraSets: 0,
    action: "hold",
    basedOn: "starter_load",
    reason:
      "First time on this lift — conservative starting weight from your profile. Adjust if it feels too easy or too heavy.",
  };
}

function buildSameExerciseProgression(
  exerciseId: string,
  targetReps: string,
  history: WorkoutSessionRecord[],
  experienceLevel: ExperienceLevel,
  e1rmKg: number | undefined,
  goal: FitnessGoal
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
    return applyE1rmGuardrails(
      {
        exerciseId,
        suggestedWeightKg: easedWeight,
        suggestedReps: lastReps ?? parsedTarget,
        extraSets: 0,
        action: "ease",
        basedOn: "same_exercise",
        lastAvgRir: avgRir,
        reason:
          "Last time felt near limit — same load today, focus on clean reps.",
      },
      e1rmKg,
      targetReps,
      goal
    );
  }

  if (action === "hold") {
    return applyE1rmGuardrails(
      {
        exerciseId,
        suggestedWeightKg: lastWeight,
        suggestedReps: lastReps ?? parsedTarget,
        extraSets: 0,
        action: "hold",
        basedOn: "same_exercise",
        lastAvgRir: avgRir,
        reason: "Solid effort last time — match or beat those numbers.",
      },
      e1rmKg,
      targetReps,
      goal
    );
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

  return applyE1rmGuardrails(
    {
      exerciseId,
      suggestedWeightKg,
      suggestedReps,
      extraSets,
      action: extraSets > 0 ? "add_set" : progressionAction,
      basedOn: "same_exercise",
      lastAvgRir: avgRir,
      reason,
    },
    e1rmKg,
    targetReps,
    goal
  );
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

function finalizePrescribedWeight(
  progression: ExerciseLoadProgression,
  unit: UnitSystem
): ExerciseLoadProgression {
  if (progression.suggestedWeightKg == null) return progression;
  return {
    ...progression,
    suggestedWeightKg: snapPrescribedWeightKg(
      progression.exerciseId,
      progression.suggestedWeightKg,
      unit
    ),
  };
}

export function buildSessionLoadProgressions(
  input: BuildLoadProgressionInput
): Map<string, ExerciseLoadProgression> {
  const {
    exercises,
    sessions,
    experienceLevel,
    goal,
    bodyweightKg = 0,
    declaredE1rmKg,
    referenceDate = new Date(),
    unit = "imperial",
  } = input;

  const recent = recentCompletedSessions(sessions, referenceDate);
  const estimatedE1rm = buildExerciseE1rmMap(
    sessions.filter((session) => session.status === "completed")
  );
  const effectiveE1rm = mergeEffectiveE1rmMap(
    declaredE1rmKg ?? new Map(),
    estimatedE1rm
  );
  const muscleSignals = buildMuscleSignals(recent);
  const progressions = new Map<string, ExerciseLoadProgression>();

  for (const exercise of exercises) {
    if (isDurationHoldExercise(exercise.exerciseId)) {
      const history = findExerciseHistory(exercise.exerciseId, recent);
      progressions.set(
        exercise.exerciseId,
        buildDurationHoldProgression(
          exercise.exerciseId,
          exercise.reps,
          history,
          experienceLevel
        )
      );
      continue;
    }

    const e1rmEntry = effectiveE1rm.get(exercise.exerciseId);
    const e1rm = e1rmEntry?.e1rmKg;
    const history = findExerciseHistory(exercise.exerciseId, recent);
    const direct = buildSameExerciseProgression(
      exercise.exerciseId,
      exercise.reps,
      history,
      experienceLevel,
      e1rm,
      goal
    );

    if (direct) {
      progressions.set(
        exercise.exerciseId,
        finalizePrescribedWeight(direct, unit)
      );
      continue;
    }

    const muscle = buildMuscleGroupProgression(
      exercise.exerciseId,
      exercise.reps,
      muscleSignals
    );
    if (muscle) {
      if (muscle.suggestedWeightKg == null) {
        const starter = buildStarterProgression(
          exercise.exerciseId,
          exercise.reps,
          bodyweightKg,
          experienceLevel
        );
        if (starter?.suggestedWeightKg != null) {
          progressions.set(
            exercise.exerciseId,
            finalizePrescribedWeight(
              {
                ...muscle,
                suggestedWeightKg: starter.suggestedWeightKg,
                reason: `${muscle.reason} Use a conservative starting weight on this lift.`,
              },
              unit
            )
          );
          continue;
        }
      }
      progressions.set(exercise.exerciseId, muscle);
      continue;
    }

    if (e1rmEntry != null) {
      progressions.set(
        exercise.exerciseId,
        finalizePrescribedWeight(
          buildE1rmBasedProgression(
            exercise.exerciseId,
            exercise.reps,
            e1rmEntry,
            goal
          ),
          unit
        )
      );
      continue;
    }

    const starter = buildStarterProgression(
      exercise.exerciseId,
      exercise.reps,
      bodyweightKg,
      experienceLevel
    );
    if (starter) {
      progressions.set(
        exercise.exerciseId,
        finalizePrescribedWeight(starter, unit)
      );
    }
  }

  return progressions;
}

export function progressionToPrefill(
  progression: ExerciseLoadProgression,
  unit: UnitSystem = "imperial"
): { weightKg?: number; reps?: number } {
  return {
    weightKg:
      progression.suggestedWeightKg != null
        ? snapPrescribedWeightKg(
            progression.exerciseId,
            progression.suggestedWeightKg,
            unit
          )
        : undefined,
    reps: progression.suggestedReps,
  };
}
