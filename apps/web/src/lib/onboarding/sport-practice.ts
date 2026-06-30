import type { SportSeasonPhase, SportPracticeGymPolicy } from "@/lib/types/profile";

export function defaultSportPracticeGymPolicy(
  seasonPhase?: SportSeasonPhase
): SportPracticeGymPolicy {
  return seasonPhase === "in_season" ? "avoid" : "allow";
}

export function resolvedSportPracticeGymPolicy(
  policy: SportPracticeGymPolicy | undefined,
  seasonPhase?: SportSeasonPhase
): SportPracticeGymPolicy {
  return policy ?? defaultSportPracticeGymPolicy(seasonPhase);
}
