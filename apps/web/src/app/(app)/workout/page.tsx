import { WorkoutHub } from "@/components/workout/workout-hub";
import { getActiveProgramRow } from "@/lib/programs/service";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

export default async function WorkoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const programRow = user ? await getActiveProgramRow(user.id) : null;

  return (
    <Suspense
      fallback={
        <div className="px-6 py-8 text-forge-muted">Loading workouts…</div>
      }
    >
      <WorkoutHub
        userId={user!.id}
        programId={programRow?.id}
        plan={programRow?.plan ?? null}
      />
    </Suspense>
  );
}
