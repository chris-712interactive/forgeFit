import { WorkoutHub } from "@/components/workout/workout-hub";
import { getWorkoutCoachingFeatures } from "@/lib/coaching/workout-features";
import { getSubscriptionForUser } from "@/lib/billing/subscription";
import { hasFeature } from "@/lib/billing/gates";
import { listIntegrationStatuses } from "@/lib/integrations/service";
import { getSpotifyPublicStatus } from "@/lib/integrations/spotify-service";
import {
  getUserOneRepMaxes,
  userOneRepMaxMap,
} from "@/lib/progression/user-maxes";
import { getActiveProgramRow } from "@/lib/programs/service";
import { getUserEquipment } from "@/lib/exercises/service";
import { getMemberContext } from "@/lib/auth/member-context";
import { createClient } from "@/lib/supabase/server";
import { getWorkoutDeviceMetricsByClientIds } from "@/lib/workouts/device-metrics-service";
import { getWorkoutReadinessContext } from "@/lib/workouts/readiness";
import { getServerSessionRecords } from "@/lib/workouts/sessions-server";
import { listWorkoutScheduleOverrides } from "@/lib/workouts/schedule-overrides-server";
import { listWorkoutDayAssignmentsForUser } from "@/lib/workouts/day-assignments-server";
import { listWorkoutTemplatesForUser } from "@/lib/workouts/templates-server";

export default async function WorkoutPage() {
  const member = await getMemberContext();
  const userId = member?.effectiveUserId;
  const supabase = await createClient();

  const programRow = userId ? await getActiveProgramRow(userId) : null;
  const plan = programRow?.plan ?? null;

  const { data: profile } = userId
    ? await supabase
        .from("profiles")
        .select("experience_level, primary_goal, weight_kg")
        .eq("id", userId)
        .single()
    : { data: null };
  const serverSessionsResult = userId
    ? await getServerSessionRecords(userId, 120)
    : { records: [], tableReady: true };
  const scheduleOverridesResult = userId
    ? await listWorkoutScheduleOverrides(userId)
    : { overrides: [], tableReady: true };
  const subscription = userId
    ? await getSubscriptionForUser(userId)
    : {
        tier: "free" as const,
        status: "inactive" as const,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      };
  const [oneRepMaxes, coachingFeatures, deviceMetricsByClientId, readiness, integrationStatuses, spotifyStatus] = userId
    ? await Promise.all([
        getUserOneRepMaxes(userId),
        getWorkoutCoachingFeatures(
          userId,
          subscription,
          serverSessionsResult.records
        ),
        getWorkoutDeviceMetricsByClientIds(
          userId,
          serverSessionsResult.records.map((session) => session.clientId)
        ),
        getWorkoutReadinessContext(userId, subscription),
        listIntegrationStatuses(userId),
        getSpotifyPublicStatus(userId),
      ])
    : [{ rows: [], tableReady: true }, null, new Map(), null, [], { connected: false }];

  const fitbitConnected =
    integrationStatuses.find((row) => row.provider === "fitbit")?.connected ===
    true;
  const spotifyConnected = spotifyStatus.connected;

  const declaredE1rmKg = userOneRepMaxMap(oneRepMaxes.rows);
  const userEquipment = userId ? await getUserEquipment(userId) : [];
  const templatesResult = userId
    ? await listWorkoutTemplatesForUser(userId)
    : { templates: [], tableReady: true };
  const dayAssignmentsResult = userId
    ? await listWorkoutDayAssignmentsForUser(userId)
    : { assignments: [], tableReady: true };
  const canCustomWorkouts = hasFeature(subscription, "custom_workouts");
  const canImportWorkouts = hasFeature(subscription, "workout_import");

  return (
    <WorkoutHub
      userId={userId!}
      programId={programRow?.id}
      plan={plan}
      userEquipment={userEquipment}
      serverSessions={serverSessionsResult.records}
      serverScheduleOverrides={scheduleOverridesResult.overrides}
      scheduleOverridesTableReady={scheduleOverridesResult.tableReady}
      workoutsTableReady={serverSessionsResult.tableReady}
      experienceLevel={profile?.experience_level ?? "beginner"}
      goal={profile?.primary_goal ?? "general_strength"}
      bodyweightKg={
        profile?.weight_kg ? Number(profile.weight_kg) : undefined
      }
      declaredE1rmKg={Object.fromEntries(declaredE1rmKg)}
      coachingFeatures={coachingFeatures}
      deviceMetricsByClientId={deviceMetricsByClientId}
      fitbitConnected={fitbitConnected}
      spotifyConnected={spotifyConnected}
      readiness={readiness}
      canCustomWorkouts={canCustomWorkouts}
      canImportWorkouts={canImportWorkouts}
      workoutTemplates={templatesResult.templates}
      dayAssignments={dayAssignmentsResult.assignments}
      dayAssignmentsTableReady={dayAssignmentsResult.tableReady}
    />
  );
}
