import type { ExperienceLevel, FitnessGoal } from "@/lib/types/profile";
import { EXPERIENCE_LEVELS, FITNESS_GOALS } from "@/lib/constants/onboarding";

export function bucketLabel(
  goal: FitnessGoal | string | null | undefined,
  experience: ExperienceLevel | string | null | undefined
): string | null {
  if (!goal || !experience) return null;

  const goalLabel =
    FITNESS_GOALS.find((item) => item.value === goal)?.label ?? goal;
  const experienceLabel =
    EXPERIENCE_LEVELS.find((item) => item.value === experience)?.label ??
    experience;

  return `${goalLabel} · ${experienceLabel}`;
}

export function winTypeLabel(
  winType: "pr" | "weekly_plan" | "streak"
): string {
  switch (winType) {
    case "pr":
      return "PR";
    case "weekly_plan":
      return "Plan complete";
    case "streak":
      return "Streak";
  }
}
