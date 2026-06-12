import { WorkoutHub } from "@/components/workout/workout-hub";
import { getWorkoutCoachingFeatures } from "@/lib/coaching/workout-features";
import { getSubscriptionForUser } from "@/lib/billing/subscription";
import {
  getUserOneRepMaxes,
  userOneRepMaxMap,
} from "@/lib/progression/user-maxes";
import { getActiveProgramRow } from "@/lib/programs/service";
import { createClient } from "@/lib/supabase/server";
import { getServerSessionRecords } from "@/lib/workouts/sessions-server";

export default async function WorkoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const programRow = user ? await getActiveProgramRow(user.id) : null;
  const plan = programRow?.plan ?? null;

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("experience_level, primary_goal, weight_kg")
        .eq("id", user.id)
        .single()
    : { data: null };
  const serverSessionsResult = user
    ? await getServerSessionRecords(user.id, 120)
    : { records: [], tableReady: true };
  const subscription = user
    ? await getSubscriptionForUser(user.id)
    : {
        tier: "free" as const,
        status: "inactive" as const,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      };
  const [oneRepMaxes, coachingFeatures] = user
    ? await Promise.all([
        getUserOneRepMaxes(user.id),
        getWorkoutCoachingFeatures(
          user.id,
          subscription,
          serverSessionsResult.records
        ),
      ])
    : [{ rows: [], tableReady: true }, null];

  const declaredE1rmKg = userOneRepMaxMap(oneRepMaxes.rows);

  return (
    <WorkoutHub
      userId={user!.id}
      programId={programRow?.id}
      plan={plan}
      serverSessions={serverSessionsResult.records}
      workoutsTableReady={serverSessionsResult.tableReady}
      experienceLevel={profile?.experience_level ?? "beginner"}
      goal={profile?.primary_goal ?? "general_strength"}
      bodyweightKg={
        profile?.weight_kg ? Number(profile.weight_kg) : undefined
      }
      declaredE1rmKg={Object.fromEntries(declaredE1rmKg)}
      coachingFeatures={coachingFeatures}
    />
  );
}
