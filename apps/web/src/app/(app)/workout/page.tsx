import { WorkoutHub } from "@/components/workout/workout-hub";
import { getPromotionEvaluation } from "@/lib/progression/service";
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
  const [promotion, oneRepMaxes] = user
    ? await Promise.all([
        getPromotionEvaluation(user.id, serverSessionsResult.records, plan),
        getUserOneRepMaxes(user.id),
      ])
    : [null, { rows: [], tableReady: true }];

  const declaredE1rmKg = userOneRepMaxMap(oneRepMaxes.rows);

  return (
    <WorkoutHub
      userId={user!.id}
      programId={programRow?.id}
      plan={plan}
      serverSessions={serverSessionsResult.records}
      workoutsTableReady={serverSessionsResult.tableReady}
      promotion={promotion}
      experienceLevel={profile?.experience_level ?? "beginner"}
      goal={profile?.primary_goal ?? "general_strength"}
      bodyweightKg={
        profile?.weight_kg ? Number(profile.weight_kg) : undefined
      }
      declaredE1rmKg={Object.fromEntries(declaredE1rmKg)}
    />
  );
}
