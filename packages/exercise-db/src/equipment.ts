/** Specific cardio machine types users can declare (replaces legacy `cardio_machines`). */
export const CARDIO_EQUIPMENT_TYPES = [
  "treadmill",
  "rowing_machine",
  "exercise_bike",
  "elliptical",
  "stair_climber",
] as const;

export type CardioEquipmentType = (typeof CARDIO_EQUIPMENT_TYPES)[number];

const LEGACY_CARDIO_ALIASES = ["cardio_machines"] as const;

/** Expand deprecated umbrella equipment into the specific types programs understand. */
export function expandUserEquipment(equipment: string[]): string[] {
  const expanded = new Set(equipment);

  for (const legacy of LEGACY_CARDIO_ALIASES) {
    if (!expanded.has(legacy)) continue;
    expanded.delete(legacy);
    for (const type of CARDIO_EQUIPMENT_TYPES) {
      expanded.add(type);
    }
  }

  return [...expanded];
}

export function hasCardioEquipment(equipment: string[]): boolean {
  const gear = new Set(expandUserEquipment(equipment));
  return CARDIO_EQUIPMENT_TYPES.some((type) => gear.has(type));
}
