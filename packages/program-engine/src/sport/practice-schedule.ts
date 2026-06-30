import type { ProgramUserProfile, SportPracticeGymPolicy } from "../types";

export function defaultSportPracticeGymPolicy(
  seasonPhase: ProgramUserProfile["sportSeasonPhase"]
): SportPracticeGymPolicy {
  return seasonPhase === "in_season" ? "avoid" : "allow";
}

/** Weekdays (Mon=0 … Sun=6) to deprioritize when assigning gym sessions. */
export function blockedWeekdaysForProfile(profile: ProgramUserProfile): number[] {
  if (profile.goal !== "sport_performance") return [];
  if (profile.sportPracticeScheduleVaries) return [];

  const policy =
    profile.sportPracticeGymPolicy ??
    defaultSportPracticeGymPolicy(profile.sportSeasonPhase);

  if (policy !== "avoid") return [];

  return profile.sportPracticeDays ?? [];
}
