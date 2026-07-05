"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getImpersonationMutationBlock } from "@/lib/auth/member-context";

const clientIdSchema = z.string().uuid();

export async function cancelWorkoutSessionOnServer(clientId: string) {
  const parsed = clientIdSchema.safeParse(clientId);
  if (!parsed.success) {
    return { error: "Invalid workout session." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }
  const impersonationBlock = await getImpersonationMutationBlock();
  if (impersonationBlock) return impersonationBlock;


  const { data: existing, error: lookupError } = await supabase
    .from("workout_sessions")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("client_id", parsed.data)
    .maybeSingle();

  if (lookupError) {
    return { error: lookupError.message };
  }

  if (!existing || existing.status === "cancelled") {
    return { success: true as const };
  }

  const timestamp = new Date().toISOString();
  const { error } = await supabase
    .from("workout_sessions")
    .update({
      status: "cancelled",
      completed_at: timestamp,
      updated_at: timestamp,
    })
    .eq("id", existing.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/workout");
  revalidatePath("/home");
  revalidatePath("/progress");

  return { success: true as const };
}
