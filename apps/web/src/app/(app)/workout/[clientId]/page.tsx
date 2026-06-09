import { ActiveWorkout } from "@/components/workout/active-workout";
import { createClient } from "@/lib/supabase/server";

interface WorkoutSessionPageProps {
  params: Promise<{ clientId: string }>;
}

export default async function WorkoutSessionPage({ params }: WorkoutSessionPageProps) {
  const { clientId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <ActiveWorkout clientId={clientId} userId={user!.id} />;
}
