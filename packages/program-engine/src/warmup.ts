import { getRecommendationValue, type EvidenceRule } from "@forgefit/evidence-kb";
import type { SessionTemplate } from "./splits";
import type { ExperienceLevel, ProgramUserProfile, WarmupBlock, WarmupMovement } from "./types";

type WarmupFocus = "push" | "pull" | "legs" | "full_body" | "general";

interface WarmupMovementDef {
  id: string;
  name: string;
  prescription: string;
  equipment?: string[];
  focuses: WarmupFocus[];
  /** Lower = earlier in the list */
  order: number;
}

const GENERAL_MOVEMENTS: WarmupMovementDef[] = [
  {
    id: "warmup_march",
    name: "March in place",
    prescription: "60 sec",
    focuses: ["push", "pull", "legs", "full_body", "general"],
    order: 0,
  },
  {
    id: "warmup_arm_circles",
    name: "Arm circles",
    prescription: "10 each direction",
    focuses: ["push", "pull", "full_body", "general"],
    order: 1,
  },
];

const FOCUS_MOVEMENTS: WarmupMovementDef[] = [
  {
    id: "warmup_band_pullapart",
    name: "Band pull-aparts",
    prescription: "15 reps",
    equipment: ["resistance_bands"],
    focuses: ["push", "full_body"],
    order: 2,
  },
  {
    id: "warmup_shoulder_circles",
    name: "Shoulder circles",
    prescription: "10 each direction",
    focuses: ["push"],
    order: 3,
  },
  {
    id: "warmup_scapular_pushup",
    name: "Scapular push-ups",
    prescription: "10 reps",
    focuses: ["push", "full_body"],
    order: 4,
  },
  {
    id: "warmup_cat_cow",
    name: "Cat-cow",
    prescription: "10 reps",
    focuses: ["pull", "full_body", "general"],
    order: 2,
  },
  {
    id: "warmup_band_face_pull",
    name: "Band face pulls",
    prescription: "15 reps",
    equipment: ["resistance_bands"],
    focuses: ["pull"],
    order: 3,
  },
  {
    id: "warmup_bodyweight_squat",
    name: "Bodyweight squats",
    prescription: "10 reps",
    focuses: ["legs", "full_body"],
    order: 2,
  },
  {
    id: "warmup_leg_swing",
    name: "Leg swings",
    prescription: "10 each leg",
    focuses: ["legs"],
    order: 3,
  },
  {
    id: "warmup_glute_bridge",
    name: "Glute bridges",
    prescription: "12 reps",
    focuses: ["legs", "full_body"],
    order: 4,
  },
  {
    id: "warmup_hip_circle",
    name: "Hip circles",
    prescription: "10 each direction",
    focuses: ["legs", "full_body"],
    order: 1,
  },
];

const FOCUS_LABELS: Record<WarmupFocus, string> = {
  push: "Push prep",
  pull: "Pull prep",
  legs: "Lower-body prep",
  full_body: "Full-body prep",
  general: "Movement prep",
};

function warmupFocusForTemplate(template: SessionTemplate): WarmupFocus {
  const name = template.name.toLowerCase();

  if (name.includes("push") || name.includes("bench")) return "push";
  if (name.includes("pull") || name.includes("deadlift")) return "pull";
  if (
    name.includes("leg") ||
    name.includes("lower") ||
    name.includes("squat focus")
  ) {
    return "legs";
  }
  if (name.includes("full body") || name.includes("metabolic")) {
    return "full_body";
  }
  if (name.includes("upper")) {
    return template.patterns.includes("horizontal_push") ? "push" : "pull";
  }
  if (name.includes("accessories") || name.includes("arms")) return "general";

  if (
    template.patterns.includes("squat") ||
    template.patterns.includes("hinge") ||
    template.patterns.includes("lunge")
  ) {
    return "legs";
  }
  if (
    template.patterns.includes("horizontal_push") ||
    template.patterns.includes("vertical_push")
  ) {
    return "push";
  }
  if (
    template.patterns.includes("horizontal_pull") ||
    template.patterns.includes("vertical_pull")
  ) {
    return "pull";
  }

  return "full_body";
}

function hasEquipment(
  movement: WarmupMovementDef,
  userEquipment: string[]
): boolean {
  if (!movement.equipment?.length) return true;
  return movement.equipment.some((item) => userEquipment.includes(item));
}

function warmupMinutesBudget(minutesPerSession: number): number {
  const capped = Math.round(minutesPerSession * 0.08);
  return Math.min(8, Math.max(3, capped));
}

function movementCountForBudget(minutes: number): number {
  if (minutes <= 4) return 2;
  if (minutes <= 6) return 3;
  return 4;
}

function selectWarmupMovements(
  focus: WarmupFocus,
  userEquipment: string[],
  maxCount: number
): WarmupMovement[] {
  const candidates = [...GENERAL_MOVEMENTS, ...FOCUS_MOVEMENTS]
    .filter(
      (movement) =>
        movement.focuses.includes(focus) && hasEquipment(movement, userEquipment)
    )
    .sort((a, b) => a.order - b.order);

  const picked: WarmupMovement[] = [];
  const usedIds = new Set<string>();

  for (const movement of candidates) {
    if (picked.length >= maxCount) break;
    if (usedIds.has(movement.id)) continue;
    usedIds.add(movement.id);
    picked.push({
      id: movement.id,
      name: movement.name,
      prescription: movement.prescription,
    });
  }

  if (picked.length < 2) {
    for (const movement of GENERAL_MOVEMENTS) {
      if (picked.length >= 2) break;
      if (usedIds.has(movement.id)) continue;
      picked.push({
        id: movement.id,
        name: movement.name,
        prescription: movement.prescription,
      });
    }
  }

  return picked;
}

export function buildWarmupBlock(
  template: SessionTemplate,
  profile: ProgramUserProfile
): WarmupBlock {
  const focus = warmupFocusForTemplate(template);
  const durationMinutes = warmupMinutesBudget(profile.minutesPerSession);
  const movements = selectWarmupMovements(
    focus,
    profile.equipment,
    movementCountForBudget(durationMinutes)
  );

  return {
    name: FOCUS_LABELS[focus],
    durationMinutes,
    focus,
    movements,
  };
}

export function warmUpRampSetCount(
  experience: ExperienceLevel,
  rules: EvidenceRule[]
): number | null {
  if (experience === "beginner") return null;

  const fromRule = getRecommendationValue<number>(rules, "warm_up_sets", "optimal");
  return fromRule ?? 3;
}

export function appendRampSetNote(
  existingNote: string | undefined,
  rampSets: number
): string {
  const rampNote = `Do ${rampSets} ramp-up sets before your working weight on this lift.`;
  return existingNote ? `${rampNote} ${existingNote}` : rampNote;
}
