import type { FitnessGoal, ProgramUserProfile } from "../types";
import { getWeeklySplit, type SessionTemplate } from "../splits";
import { getSportWeeklySplit } from "./splits";

export function resolveWeeklySplit(profile: ProgramUserProfile): SessionTemplate[] {
  if (profile.goal === "sport_performance" && profile.sportId) {
    return getSportWeeklySplit(
      profile.sportId,
      profile.sportPositionId,
      profile.sessionsPerWeek
    );
  }

  return getWeeklySplit(profile.goal, profile.sessionsPerWeek);
}

/** Nutrition goal used when primary goal is sport (hybrid secondary support). */
export function resolveNutritionGoal(profile: ProgramUserProfile): FitnessGoal {
  if (profile.goal !== "sport_performance") {
    return profile.goal;
  }

  if (profile.sportSeasonPhase === "in_season") {
    return "sport_performance";
  }

  if (profile.secondaryGoal === "fat_loss") {
    return "fat_loss";
  }
  if (profile.secondaryGoal === "recomposition") {
    return "recomposition";
  }
  if (
    profile.secondaryGoal === "bodybuilding" ||
    profile.secondaryGoal === "general_strength" ||
    profile.secondaryGoal === "powerlifting"
  ) {
    return profile.secondaryGoal;
  }

  return "sport_performance";
}

export {
  applyPositionModifier,
  modifierForPosition,
  POSITION_PATTERN_BOOSTS,
  baseTemplatesForSport,
  getSportWeeklySplit,
} from "./splits";
export { sportSessionCap, sportSummarySuffix, sportVolumeMultiplier } from "./volume";
