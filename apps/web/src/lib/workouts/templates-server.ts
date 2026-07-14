import { createClient } from "@/lib/supabase/server";
import { hasFeature } from "@/lib/billing/gates";
import { getSubscriptionForUser } from "@/lib/billing/subscription";
import type { WarmupBlock } from "@forgefit/program-engine";
import type {
  IntervalProtocol,
  WorkoutTemplateExercise,
} from "@forgefit/offline-sync";

export interface WorkoutTemplateRecord {
  id: string;
  name: string;
  exercises: WorkoutTemplateExercise[];
  warmup?: WarmupBlock | null;
  intervalProtocol?: IntervalProtocol | null;
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
    .select("id, name, exercises, warmup, interval_protocol")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    const missing = error.message.toLowerCase().includes("user_workout_templates");
    if (missing) {
      return { templates: [], tableReady: false };
    }
    if (error.message.toLowerCase().includes("interval_protocol")) {
      const fallback = await supabase
        .from("user_workout_templates")
        .select("id, name, exercises, warmup")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });
      if (fallback.error) {
        return { templates: [], tableReady: true };
      }
      return {
        tableReady: true,
        templates: (fallback.data ?? []).map((row) => ({
          id: String(row.id),
          name: String(row.name),
          exercises: row.exercises as WorkoutTemplateExercise[],
          warmup: (row.warmup as WarmupBlock | null) ?? null,
          intervalProtocol: null,
        })),
      };
    }
    return { templates: [], tableReady: true };
  }

  return {
    tableReady: true,
    templates: (data ?? []).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      exercises: row.exercises as WorkoutTemplateExercise[],
      warmup: (row.warmup as WarmupBlock | null) ?? null,
      intervalProtocol:
        (row.interval_protocol as IntervalProtocol | null) ?? null,
    })),
  };
}
