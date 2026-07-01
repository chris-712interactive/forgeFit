import type { ExperienceLevel, FitnessGoal } from "@/lib/types/profile";
import { EXPERIENCE_LEVELS, FITNESS_GOALS } from "@/lib/constants/onboarding";
import {
  formatWeight,
  type UnitSystem,
} from "@/lib/units/measurements";

/** Converts legacy metric PR win copy for the viewer's unit preference. */
export function formatCommunityWinDetail(
  detail: string | null,
  unit: UnitSystem
): string | null {
  if (!detail || unit === "metric") {
    return detail;
  }

  return detail.replace(
    /(\d+(?:\.\d+)?)\s+reps\s+at\s+(\d+(?:\.\d+)?)\s+kg\b/gi,
    (_, reps: string, kg: string) =>
      `${reps} reps at ${formatWeight(Number(kg), unit)}`
  );
}

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

export type LeagueTier = "bronze" | "silver" | "gold";

export function leagueTierLabel(tier: LeagueTier | string): string {
  switch (tier) {
    case "silver":
      return "Silver";
    case "gold":
      return "Gold";
    default:
      return "Bronze";
  }
}

export function badgeLabel(badgeKey: string): string {
  switch (badgeKey) {
    case "league_silver":
      return "Silver League";
    case "league_gold":
      return "Gold League";
    case "season_champion":
      return "Season Champion";
    case "season_podium":
      return "Podium Finish";
    case "season_promoted":
      return "Promoted";
    default:
      return badgeKey;
  }
}
