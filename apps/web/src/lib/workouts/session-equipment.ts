import { resolveExerciseDetail } from "@forgefit/exercise-db";
import type { LocalWorkoutSession } from "@forgefit/offline-sync";
import { formatEquipment } from "@/lib/exercises/labels";
import { recoveryEquipmentLabel } from "@/lib/workouts/recovery";

export interface SessionEquipmentEntry {
  equipmentKey: string;
  label: string;
  usedFor: string[];
}

export function collectSessionEquipment(
  session: LocalWorkoutSession
): SessionEquipmentEntry[] {
  const byKey = new Map<string, { label: string; usedFor: Set<string> }>();

  function addEquipment(key: string, label: string, usedFor: string) {
    const existing = byKey.get(key) ?? { label, usedFor: new Set<string>() };
    existing.usedFor.add(usedFor);
    byKey.set(key, existing);
  }

  for (const exercise of session.exercises) {
    const detail = resolveExerciseDetail(exercise.exerciseId);
    const equipment = detail?.equipment ?? ["bodyweight_only"];

    for (const item of equipment) {
      addEquipment(item, formatEquipment(item), exercise.name);
    }
  }

  if (session.recoveryBlock?.equipment) {
    addEquipment(
      session.recoveryBlock.equipment,
      recoveryEquipmentLabel(session.recoveryBlock.equipment),
      `Recovery — ${session.recoveryBlock.name}`
    );
  }

  return [...byKey.entries()]
    .map(([equipmentKey, value]) => ({
      equipmentKey,
      label: value.label,
      usedFor: [...value.usedFor].sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
