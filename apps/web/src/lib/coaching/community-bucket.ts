import {
  computeAgeFromDateOfBirth,
  isValidDateOfBirth,
  resolveProfileAge,
  type ProfileIdentityFields,
} from "@/lib/profile/identity";
import { requiresParentConsent, resolveAgeCohort } from "@forgefit/program-engine";
import type { FitnessGoal } from "@/lib/types/profile";

export type CommunityAgeCohort = "teen" | "adult";

export interface CommunityBucket {
  bucketGoal: string;
  bucketExperience: string;
  bucketAgeCohort: CommunityAgeCohort;
}

export interface CommunityProfileFields extends ProfileIdentityFields {
  age?: number | null;
  experience_level?: string | null;
  primary_goal?: FitnessGoal | null;
  parent_consent_at?: string | null;
}

export function resolveCommunityAgeCohort(
  profile: CommunityProfileFields,
  asOf = new Date()
): CommunityAgeCohort {
  const age = resolveProfileAge(profile, asOf);
  if (age == null) {
    return "adult";
  }
  return resolveAgeCohort(age);
}

export function resolveCommunityBucket(
  profile: CommunityProfileFields,
  asOf = new Date()
): CommunityBucket | null {
  if (!profile.primary_goal || !profile.experience_level) {
    return null;
  }

  return {
    bucketGoal: profile.primary_goal,
    bucketExperience: profile.experience_level,
    bucketAgeCohort: resolveCommunityAgeCohort(profile, asOf),
  };
}

export function communityBucketKey(bucket: CommunityBucket): string {
  return `${bucket.bucketGoal}:${bucket.bucketExperience}:${bucket.bucketAgeCohort}`;
}

export function canOptIntoCommunity(profile: CommunityProfileFields): {
  allowed: boolean;
  reason?: string;
} {
  if (!profile.date_of_birth || !isValidDateOfBirth(profile.date_of_birth)) {
    return { allowed: true };
  }

  const age = computeAgeFromDateOfBirth(profile.date_of_birth);
  if (requiresParentConsent(age) && !profile.parent_consent_at) {
    return {
      allowed: false,
      reason:
        "Parent or guardian sign-off is required before joining community features.",
    };
  }

  return { allowed: true };
}

export function formatCommunityCohortLabel(cohort: CommunityAgeCohort): string {
  return cohort === "teen" ? "Teen league (under 18)" : "Adult league (18+)";
}
