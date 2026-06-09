import { WorkoutHub } from "@/components/workout/workout-hub";
import { getPromotionEvaluation } from "@/lib/progression/service";
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
        .select("experience_level")
        .eq("id", user.id)
        .single()
    : { data: null };
  const serverSessionsResult = user
    ? await getServerSessionRecords(user.id, 120)
    : { records: [], tableReady: true };
  const promotion = user
    ? await getPromotionEvaluation(user.id, serverSessionsResult.records, plan)
    : null;

  return (
    <WorkoutHub
      userId={user!.id}
      programId={programRow?.id}
      plan={plan}
      serverSessions={serverSessionsResult.records}
      workoutsTableReady={serverSessionsResult.tableReady}
      promotion={promotion}
      experienceLevel={profile?.experience_level ?? "beginner"}
    />
  );
}
