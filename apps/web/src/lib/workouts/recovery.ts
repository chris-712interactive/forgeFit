import { RECOVERY_EQUIPMENT } from "@/lib/constants/onboarding";
import { buildEvidenceHref } from "@/lib/evidence/present";
import type { RecoveryBlock } from "@forgefit/program-engine";

export type RecoveryStatus = "pending" | "completed" | "skipped";

const EQUIPMENT_RULE_IDS: Record<string, string> = {
  foam_roller: "foam_rolling_recovery",
  massage_gun: "massage_gun_recovery",
  cold_plunge: "cold_plunge_recovery",
  cryotherapy: "cryotherapy_recovery",
  sauna: "sauna_recovery",
  red_light_therapy: "red_light_recovery",
  active_recovery_access: "active_recovery_access",
};

const EQUIPMENT_GUIDANCE: Record<string, string[]> = {
  foam_roller: ["Quads", "Glutes", "Upper back", "Lats"],
  lacrosse_ball: ["Feet", "Glutes", "Upper traps"],
  trigger_point_ball: ["Calves", "Hip flexors", "Forearms"],
  massage_gun: ["Quads", "Hamstrings", "Glutes", "Upper back"],
  resistance_bands: ["Shoulders", "Hips", "Ankles"],
  yoga_mat: ["Hamstrings", "Hips", "Thoracic spine"],
  yoga_blocks_strap: ["Hamstrings", "Hips", "Chest opener"],
  compression_boots: ["Legs — follow device guidance"],
  compression_gear: ["Target sore muscle groups"],
  sauna: ["Relax and hydrate after heat exposure"],
  steam_room: ["Light breathing and mobility between steam"],
  hot_tub: ["Easy movement and hydration"],
  cold_plunge: ["Brief immersion on legs or full body"],
  cryotherapy: ["Follow facility protocol"],
  red_light_therapy: ["Target worked muscle groups"],
  active_recovery_access: ["Easy walk, bike, or swim"],
};

export function recoveryEquipmentLabel(equipment: string): string {
  return (
    RECOVERY_EQUIPMENT.find((item) => item.value === equipment)?.label ??
    equipment.replace(/_/g, " ")
  );
}

export function recoveryRuleIdForEquipment(equipment: string): string | null {
  return EQUIPMENT_RULE_IDS[equipment] ?? null;
}

export function recoveryEvidenceHref(block: RecoveryBlock): string {
  const ruleId = recoveryRuleIdForEquipment(block.equipment);
  return buildEvidenceHref(ruleId ? { focus: ruleId } : undefined);
}

export function recoveryGuidanceSteps(block: RecoveryBlock): string[] {
  return (
    EQUIPMENT_GUIDANCE[block.equipment] ?? [
      "Spend a few minutes on areas that feel tight from today's session",
    ]
  );
}

export function formatRecoveryDuration(minutes: number): string {
  return minutes === 1 ? "1 min" : `${minutes} min`;
}

export function recoveryMinutesLogged(input: {
  recoveryStatus?: RecoveryStatus | "completed" | "skipped" | null;
  recoveryDurationMs?: number | null;
  recoveryBlock?: Pick<RecoveryBlock, "durationMinutes"> | null;
  plannedRecoveryMinutes?: number | null;
}): number {
  if (input.recoveryStatus !== "completed") return 0;

  if (input.recoveryDurationMs != null && input.recoveryDurationMs > 0) {
    return Math.max(1, Math.round(input.recoveryDurationMs / 60_000));
  }

  return (
    input.recoveryBlock?.durationMinutes ??
    input.plannedRecoveryMinutes ??
    0
  );
}
