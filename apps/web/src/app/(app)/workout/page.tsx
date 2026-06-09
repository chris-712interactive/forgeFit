import { WorkoutHub } from "@/components/workout/workout-hub";
import { getActiveProgramRow } from "@/lib/programs/service";
import { createClient } from "@/lib/supabase/server";
import { getWorkoutHistory } from "@/lib/workouts/history";

export default async function WorkoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const programRow = user ? await getActiveProgramRow(user.id) : null;
  const history = user ? await getWorkoutHistory(user.id) : [];

  return (
    <WorkoutHub
      userId={user!.id}
      programId={programRow?.id}
      plan={programRow?.plan ?? null}
      history={history}
    />
  );
}
