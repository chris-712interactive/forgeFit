import { createClient } from "@/lib/supabase/server";
import { hasFeature } from "@/lib/billing/gates";
import { getSubscriptionForUser } from "@/lib/billing/subscription";
import type { LocalWorkoutDayAssignment } from "@forgefit/offline-sync";

export interface WorkoutDayAssignmentRecord {
  id: string;
  templateId: string;
  scheduledDateIso: string;
  replacesProgram: boolean;
  templateName: string;
}

export async function listWorkoutDayAssignmentsForUser(
  userId: string
): Promise<{ assignments: WorkoutDayAssignmentRecord[]; tableReady: boolean }> {
  const subscription = await getSubscriptionForUser(userId);
  if (!hasFeature(subscription, "custom_workouts")) {
    return { assignments: [], tableReady: true };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_workout_day_assignments")
    .select(
      "id, template_id, scheduled_date, replaces_program, user_workout_templates(name)"
    )
    .eq("user_id", userId)
    .order("scheduled_date", { ascending: true });

  if (error) {
    const missing = error.message
      .toLowerCase()
      .includes("user_workout_day_assignments");
    return { assignments: [], tableReady: !missing };
  }

  return {
    tableReady: true,
    assignments: (data ?? []).map((row) => {
      const templateJoin = row.user_workout_templates as
        | { name?: string }
        | { name?: string }[]
        | null;
      const templateName = Array.isArray(templateJoin)
        ? templateJoin[0]?.name
        : templateJoin?.name;

      return {
        id: String(row.id),
        templateId: String(row.template_id),
        scheduledDateIso: String(row.scheduled_date),
        replacesProgram: Boolean(row.replaces_program),
        templateName: templateName ? String(templateName) : "Custom workout",
      };
    }),
  };
}

export function toLocalDayAssignment(
  userId: string,
  row: WorkoutDayAssignmentRecord
): LocalWorkoutDayAssignment {
  const now = new Date().toISOString();
  return {
    id: row.id,
    userId,
    templateId: row.templateId,
    scheduledDateIso: row.scheduledDateIso,
    replacesProgram: row.replacesProgram,
    createdAt: now,
    updatedAt: now,
    synced: true,
  };
}
