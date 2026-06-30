import { getRecommendationValue, type EvidenceRule } from "@forgefit/evidence-kb";
import type { ProgramUserProfile } from "../types";

export function sportVolumeMultiplier(
  profile: ProgramUserProfile,
  rules: EvidenceRule[],
  baseMultiplier: number
): number {
  if (profile.goal !== "sport_performance") {
    return baseMultiplier;
  }

  let mult = baseMultiplier;

  const fromRules = getRecommendationValue<number>(
    rules,
    "volume_multiplier",
    "optimal"
  );
  if (fromRules != null) {
    mult *= fromRules;
  }

  return mult;
}

export function sportSessionCap(
  profile: ProgramUserProfile,
  rules: EvidenceRule[]
): number | undefined {
  if (profile.goal !== "sport_performance") {
    return undefined;
  }

  return getRecommendationValue<number>(
    rules,
    "max_gym_sessions_per_week",
    "optimal"
  );
}

export function sportSummarySuffix(profile: ProgramUserProfile): string {
  if (profile.goal !== "sport_performance" || !profile.sportId) {
    return "";
  }

  const parts = [profile.sportId.replace(/_/g, " ")];
  if (profile.sportPositionId) {
    parts.push(profile.sportPositionId.replace(/_/g, " "));
  }
  if (profile.sportSeasonPhase) {
    parts.push(profile.sportSeasonPhase.replace(/_/g, " "));
  }
  return ` · ${parts.join(" · ")}`;
}
