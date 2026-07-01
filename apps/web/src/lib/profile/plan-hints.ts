import {
  FITNESS_GOALS,
  SPORT_PERFORMANCE_GOAL,
} from "@/lib/constants/onboarding";
import type { UserEquipmentSettings } from "@/lib/equipment/service";
import type { FitnessGoal } from "@/lib/types/profile";
import { getSportById } from "@forgefit/evidence-kb";

export function formatProgramPlanHint(input: {
  goal: FitnessGoal | null;
  sessionsPerWeek: number | null;
  minutesPerSession: number | null;
  sportId?: string | null;
}): string {
  const sessions = input.sessionsPerWeek ?? 3;
  const minutes = input.minutesPerSession ?? 45;
  const schedule = `${sessions}×${minutes} min`;

  if (input.goal === SPORT_PERFORMANCE_GOAL.value) {
    const sport = getSportById(input.sportId ?? undefined);
    return sport ? `${sport.label} · ${schedule}` : `Sport · ${schedule}`;
  }

  if (input.goal === "functional_conditioning") {
    return `Functional conditioning · ${schedule}`;
  }

  const goal = FITNESS_GOALS.find((item) => item.value === input.goal);
  return `${goal?.label ?? "Plan"} · ${schedule}`;
}

export function formatEquipmentHint(settings: UserEquipmentSettings): string {
  if (settings.isTravelMode) return "Travel mode";
  const count = settings.equipment.length;
  if (count === 0) return "None selected";
  return `${count} item${count === 1 ? "" : "s"}`;
}
