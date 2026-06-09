import { WorkoutHub } from "@/components/workout/workout-hub";
import { getActiveProgramRow } from "@/lib/programs/service";
import { createClient } from "@/lib/supabase/server";
import { getServerSessionRecords } from "@/lib/workouts/sessions-server";

export default async function WorkoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const programRow = user ? await getActiveProgramRow(user.id) : null;
  const serverSessionsResult = user
    ? await getServerSessionRecords(user.id)
    : { records: [], tableReady: true };

  return (
    <WorkoutHub
      userId={user!.id}
      programId={programRow?.id}
      plan={programRow?.plan ?? null}
      serverSessions={serverSessionsResult.records}
      workoutsTableReady={serverSessionsResult.tableReady}
    />
  );
}
