import type { ExperienceLevel, FatLossPace, FitnessGoal } from "./types";

export type AgeBand =
  | "youth_13_15"
  | "teen_16_17"
  | "young_adult_18_22"
  | "adult_23_plus";

/** Community matching: teen &lt; 18, adult otherwise (slice 9G). */
export type AgeCohort = "teen" | "adult";

/** Ages 13–15 inclusive require parent sign-off. */
export const PARENT_CONSENT_MAX_AGE = 15;

const MIN_AGE = 13;

export function resolveAgeBand(age: number): AgeBand {
  if (age < 16) return "youth_13_15";
  if (age < 18) return "teen_16_17";
  if (age <= 22) return "young_adult_18_22";
  return "adult_23_plus";
}

export function resolveAgeCohort(age: number): AgeCohort {
  return age < 18 ? "teen" : "adult";
}

export function requiresParentConsent(age: number): boolean {
  return age >= MIN_AGE && age <= PARENT_CONSENT_MAX_AGE;
}

export function minAgeForPrimaryGoal(goal: FitnessGoal): number {
  switch (goal) {
    case "sport_performance":
    case "functional_conditioning":
    case "fat_loss":
    case "general_strength":
      return MIN_AGE;
    case "recomposition":
    case "bodybuilding":
      return 15;
    case "powerlifting":
      return 16;
    default:
      return MIN_AGE;
  }
}

export function isPrimaryGoalAllowedForAge(
  goal: FitnessGoal,
  age: number
): boolean {
  return age >= minAgeForPrimaryGoal(goal);
}

export function isSecondaryGoalAllowedForAge(
  goal: FitnessGoal,
  age: number
): boolean {
  if (goal === "sport_performance") {
    return false;
  }
  return isPrimaryGoalAllowedForAge(goal, age);
}

export function minAgeForFatLossPace(pace: FatLossPace): number {
  switch (pace) {
    case "steady":
      return MIN_AGE;
    case "moderate":
      return 16;
    case "aggressive":
      return 18;
    default:
      return MIN_AGE;
  }
}

export function isFatLossPaceAllowedForAge(
  pace: FatLossPace,
  age: number
): boolean {
  return age >= minAgeForFatLossPace(pace);
}

export function capExperienceForAge(
  experience: ExperienceLevel,
  age: number
): ExperienceLevel {
  if (age < 16 && experience === "advanced") {
    return "intermediate";
  }
  return experience;
}

export function maxSessionsPerWeekForAge(age: number): number {
  if (age <= 15) return 4;
  if (age <= 17) return 5;
  return 6;
}

export function maxMinutesPerSessionForAge(age: number): number {
  if (age <= 15) return 60;
  if (age <= 17) return 75;
  return 90;
}

export function primaryGoalBlockedReason(
  goal: FitnessGoal,
  age: number
): string | null {
  if (isPrimaryGoalAllowedForAge(goal, age)) {
    return null;
  }
  const min = minAgeForPrimaryGoal(goal);
  return `Available at age ${min}+`;
}

export function fatLossPaceBlockedReason(
  pace: FatLossPace,
  age: number
): string | null {
  if (isFatLossPaceAllowedForAge(pace, age)) {
    return null;
  }
  const min = minAgeForFatLossPace(pace);
  return `Available at age ${min}+`;
}
