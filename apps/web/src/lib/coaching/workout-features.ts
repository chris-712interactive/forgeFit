import { hasFeature } from "@/lib/billing/gates";
import type { SubscriptionSnapshot } from "@/lib/billing/types";
import { computeWeeklyWorkStats } from "@/lib/home/weekly-stats";
import {
  buildExerciseE1rmMap,
  mergeEffectiveE1rmMap,
} from "@/lib/progression/one-rep-max";
import { profileFirstName } from "@/lib/profile/identity";
import { getActiveProgram } from "@/lib/programs/service";
import { getCommunityRankSnapshot } from "@/lib/coaching/service";
import type {
  ExperienceLevel,
  FitnessGoal,
} from "@/lib/types/profile";
import { createClient } from "@/lib/supabase/server";
import type { WorkoutSessionRecord } from "@/lib/workouts/sessions";
import type { WorkoutCoachingFeatures } from "./types";

export async function getWorkoutCoachingFeatures(
  userId: string,
  subscription: SubscriptionSnapshot,
  sessions: WorkoutSessionRecord[],
  declaredE1rmKg?: Record<string, number>
): Promise<WorkoutCoachingFeatures> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "first_name, last_name, display_name, primary_goal, experience_level, why_started, gamification_opt_in"
    )
    .eq("id", userId)
    .single();

  const plan = await getActiveProgram(userId);
  const weekly = computeWeeklyWorkStats(sessions, plan);
  const estimatedMap = buildExerciseE1rmMap(
    sessions.filter((session) => session.status === "completed")
  );
  const declaredMap = new Map(Object.entries(declaredE1rmKg ?? {}));
  const priorMap = mergeEffectiveE1rmMap(declaredMap, estimatedMap);
  const communityRank = hasFeature(subscription, "gamification")
    ? await getCommunityRankSnapshot(userId, subscription, sessions)
    : null;

  return {
    aiMotivationEnabled: hasFeature(subscription, "ai_motivation"),
    prCelebrationEnabled: hasFeature(subscription, "pr_celebration"),
    prToastEnabled: !hasFeature(subscription, "pr_celebration"),
    gamificationOptIn: profile?.gamification_opt_in ?? false,
    priorBestE1rmKg: Object.fromEntries(
      [...priorMap.entries()].map(([exerciseId, entry]) => [
        exerciseId,
        entry.e1rmKg,
      ])
    ),
    goal: (profile?.primary_goal as FitnessGoal | null) ?? "general_strength",
    displayName: profile
      ? profileFirstName({
          first_name: profile.first_name,
          last_name: profile.last_name,
          display_name: profile.display_name,
        })
      : null,
    experienceLevel:
      (profile?.experience_level as ExperienceLevel | null) ?? "beginner",
    whyStarted: profile?.why_started ?? null,
    isDeloadWeek: plan?.isDeloadWeek ?? false,
    workoutsCompletedThisWeek: weekly.workoutsCompleted,
    workoutsPlannedThisWeek: weekly.workoutsPlanned,
    communityRank,
  };
}
