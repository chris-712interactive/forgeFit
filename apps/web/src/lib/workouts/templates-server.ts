import { createClient } from "@/lib/supabase/server";
import { hasFeature } from "@/lib/billing/gates";
import { getSubscriptionForUser } from "@/lib/billing/subscription";
import type { WarmupBlock } from "@forgefit/program-engine";
import type { WorkoutTemplateExercise } from "@forgefit/offline-sync";

export interface WorkoutTemplateRecord {
  id: string;
  name: string;
  exercises: WorkoutTemplateExercise[];
  warmup?: WarmupBlock | null;
}

export async function listWorkoutTemplatesForUser(
  userId: string
): Promise<{ templates: WorkoutTemplateRecord[]; tableReady: boolean }> {
  const subscription = await getSubscriptionForUser(userId);
  if (!hasFeature(subscription, "custom_workouts")) {
    return { templates: [], tableReady: true };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_workout_templates")
    .select("id, name, exercises, warmup")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    const missing = error.message.toLowerCase().includes("user_workout_templates");
    return { templates: [], tableReady: !missing };
  }

  return {
    tableReady: true,
    templates: (data ?? []).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      exercises: row.exercises as WorkoutTemplateExercise[],
      warmup: (row.warmup as WarmupBlock | null) ?? null,
    })),
  };
}
