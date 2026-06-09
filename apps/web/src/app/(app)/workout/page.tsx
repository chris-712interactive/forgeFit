import { WorkoutHub } from "@/components/workout/workout-hub";
import { getActiveProgramRow } from "@/lib/programs/service";
import { createClient } from "@/lib/supabase/server";

export default async function WorkoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const programRow = user ? await getActiveProgramRow(user.id) : null;

  return (
    <WorkoutHub
      userId={user!.id}
      programId={programRow?.id}
      plan={programRow?.plan ?? null}
    />
  );
}
