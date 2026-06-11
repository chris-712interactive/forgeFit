import { resolveExerciseDetail } from "@forgefit/exercise-db";
import type { WorkoutSessionRecord } from "@/lib/workouts/sessions";
import type { MuscleVolumeSlice, WeeklyVolumePoint } from "./types";

function weekStartMonday(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date.toISOString().slice(0, 10);
}

function parseReps(reps?: number): number {
  if (reps == null || !Number.isFinite(reps)) return 0;
  return reps;
}

function setVolumeKg(set: WorkoutSessionRecord["sets"][number]): number {
  if (!set.completed || set.weightKg == null || set.weightKg <= 0) return 0;
  const reps = parseReps(set.reps);
  return reps > 0 ? set.weightKg * reps : 0;
}

export function buildWeeklyVolumeTrend(
  sessions: WorkoutSessionRecord[],
  cutoffIso: string | null
): WeeklyVolumePoint[] {
  const byWeek = new Map<string, { volumeKg: number; sessions: Set<string> }>();

  for (const session of sessions) {
    if (session.status !== "completed") continue;

    const date = (session.completedAt ?? session.startedAt).slice(0, 10);
    if (cutoffIso && date < cutoffIso) continue;

    const week = weekStartMonday(date);
    const entry = byWeek.get(week) ?? { volumeKg: 0, sessions: new Set<string>() };
    entry.sessions.add(session.id);

    for (const set of session.sets) {
      entry.volumeKg += setVolumeKg(set);
    }

    byWeek.set(week, entry);
  }

  return [...byWeek.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, value]) => ({
      weekStart,
      volumeKg: Math.round(value.volumeKg),
      sessions: value.sessions.size,
    }));
}

export function buildMuscleVolumeSlices(
  sessions: WorkoutSessionRecord[],
  cutoffIso: string | null,
  topN = 8
): MuscleVolumeSlice[] {
  const totals = new Map<string, number>();

  for (const session of sessions) {
    if (session.status !== "completed") continue;

    const date = (session.completedAt ?? session.startedAt).slice(0, 10);
    if (cutoffIso && date < cutoffIso) continue;

    for (const set of session.sets) {
      const volume = setVolumeKg(set);
      if (volume <= 0) continue;

      const detail = resolveExerciseDetail(set.exerciseId);
      const muscles =
        detail?.primaryMuscles?.length
          ? detail.primaryMuscles
          : ["other"];

      const share = volume / muscles.length;
      for (const muscle of muscles) {
        totals.set(muscle, (totals.get(muscle) ?? 0) + share);
      }
    }
  }

  return [...totals.entries()]
    .map(([muscle, volumeKg]) => ({
      muscle,
      volumeKg: Math.round(volumeKg),
    }))
    .sort((a, b) => b.volumeKg - a.volumeKg)
    .slice(0, topN);
}
