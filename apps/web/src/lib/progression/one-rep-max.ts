import type { FitnessGoal } from "@/lib/types/profile";
import type { ExperienceLevel } from "@/lib/types/profile";
import type { WorkoutSessionRecord, WorkoutSetRecord } from "@/lib/workouts/sessions";

/** Fraction of bodyweight for first-time compound lifts (no logged history). */
const STARTER_BW_RATIO: Record<
  string,
  Record<ExperienceLevel, number>
> = {
  barbell_squat: { beginner: 0.55, intermediate: 0.85, advanced: 1.05 },
  barbell_bench: { beginner: 0.4, intermediate: 0.65, advanced: 0.85 },
  barbell_deadlift: { beginner: 0.7, intermediate: 1.0, advanced: 1.25 },
  overhead_press: { beginner: 0.28, intermediate: 0.45, advanced: 0.6 },
  romanian_deadlift: { beginner: 0.45, intermediate: 0.65, advanced: 0.8 },
  goblet_squat: { beginner: 0.2, intermediate: 0.3, advanced: 0.4 },
  leg_press: { beginner: 0.9, intermediate: 1.4, advanced: 1.8 },
};

export function estimateE1rmFromSet(
  weightKg: number,
  reps: number,
  rir?: number
): number {
  const effectiveReps = reps + (rir ?? 0);
  if (effectiveReps <= 0) return weightKg;
  // Epley formula
  return weightKg * (1 + effectiveReps / 30);
}

export function percent1rmForReps(
  reps: number,
  goal: FitnessGoal
): number {
  const table: Record<number, number> = {
    1: 1.0,
    2: 0.95,
    3: 0.9,
    4: 0.87,
    5: 0.85,
    6: 0.82,
    8: 0.78,
    10: 0.72,
    12: 0.7,
    15: 0.65,
  };

  const keys = Object.keys(table)
    .map(Number)
    .sort((a, b) => a - b);

  let closest = keys[0] ?? 8;
  for (const key of keys) {
    if (Math.abs(key - reps) < Math.abs(closest - reps)) closest = key;
  }

  let pct = table[closest] ?? 0.75;

  if (goal === "powerlifting" || goal === "general_strength") {
    pct = Math.min(0.95, pct + 0.05);
  }
  if (goal === "fat_loss") {
    pct = Math.max(0.65, pct - 0.03);
  }

  return pct;
}

export function workingWeightFromE1rm(
  e1rmKg: number,
  targetReps: number,
  goal: FitnessGoal,
  targetRir = 2
): number {
  const pct = percent1rmForReps(targetReps, goal);
  const rirAdjust = 1 + targetRir * 0.025;
  return roundWeightKg(e1rmKg * pct * rirAdjust);
}

export function roundWeightKg(kg: number): number {
  return Math.round(kg * 2) / 2;
}

function workingSets(sets: WorkoutSetRecord[]): WorkoutSetRecord[] {
  return sets.filter(
    (set) =>
      set.completed &&
      set.weightKg != null &&
      set.weightKg > 0 &&
      set.reps != null &&
      set.reps > 0
  );
}

export interface EffectiveE1rmEntry {
  e1rmKg: number;
  source: "user_declared" | "estimated" | "blended";
}

/** Merge user-declared maxes with log estimates (higher value wins per lift). */
export function mergeEffectiveE1rmMap(
  declared: Map<string, number>,
  estimated: Map<string, number>
): Map<string, EffectiveE1rmEntry> {
  const merged = new Map<string, EffectiveE1rmEntry>();
  const keys = new Set([...declared.keys(), ...estimated.keys()]);

  for (const exerciseId of keys) {
    const userMax = declared.get(exerciseId);
    const logEst = estimated.get(exerciseId);

    if (userMax != null && logEst != null) {
      if (logEst > userMax) {
        merged.set(exerciseId, { e1rmKg: logEst, source: "blended" });
      } else {
        merged.set(exerciseId, { e1rmKg: userMax, source: "user_declared" });
      }
      continue;
    }

    if (userMax != null) {
      merged.set(exerciseId, { e1rmKg: userMax, source: "user_declared" });
      continue;
    }

    if (logEst != null) {
      merged.set(exerciseId, { e1rmKg: logEst, source: "estimated" });
    }
  }

  return merged;
}

/** Best recent estimated 1RM per exercise from logged history. */
export function buildExerciseE1rmMap(
  sessions: WorkoutSessionRecord[]
): Map<string, number> {
  const map = new Map<string, number>();

  for (const session of sessions) {
    if (session.status !== "completed") continue;
    for (const set of workingSets(session.sets)) {
      const estimate = estimateE1rmFromSet(
        set.weightKg!,
        set.reps!,
        set.rir
      );
      const current = map.get(set.exerciseId) ?? 0;
      if (estimate > current) {
        map.set(set.exerciseId, estimate);
      }
    }
  }

  return map;
}

export function starterLoadKg(
  exerciseId: string,
  bodyweightKg: number,
  experienceLevel: ExperienceLevel
): number | undefined {
  const ratios = STARTER_BW_RATIO[exerciseId];
  if (!ratios || bodyweightKg <= 0) return undefined;
  return roundWeightKg(bodyweightKg * ratios[experienceLevel]);
}

export function clampWeightToE1rmBand(
  weightKg: number,
  e1rmKg: number,
  targetReps: number,
  goal: FitnessGoal
): number {
  const target = workingWeightFromE1rm(e1rmKg, targetReps, goal, 2);
  const floor = workingWeightFromE1rm(e1rmKg, targetReps, goal, 4);
  const ceiling = roundWeightKg(e1rmKg * 0.92);
  return roundWeightKg(
    Math.min(ceiling, Math.max(floor, weightKg > 0 ? weightKg : target))
  );
}

export function formatE1rmLabel(e1rmKg: number, unit: "kg" | "lb" = "kg"): string {
  if (unit === "lb") {
    return `${Math.round(e1rmKg * 2.20462)} lb`;
  }
  return `${roundWeightKg(e1rmKg)} kg`;
}
