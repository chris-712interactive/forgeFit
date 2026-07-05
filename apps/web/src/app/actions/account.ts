"use server";

import { getImpersonationMutationBlock } from "@/lib/auth/member-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const deleteSchema = z.object({
  confirmationEmail: z.string().email(),
});

export async function deleteAccount(confirmationEmail: string) {
  const parsed = deleteSchema.safeParse({ confirmationEmail });
  if (!parsed.success) {
    return { error: "Enter the email address on your account." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "Unauthorized" };
  }

  const impersonationBlock = await getImpersonationMutationBlock();
  if (impersonationBlock) return impersonationBlock;

  if (
    parsed.data.confirmationEmail.trim().toLowerCase() !==
    user.email.trim().toLowerCase()
  ) {
    return { error: "Email does not match your account." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Account deletion is not configured.",
    };
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return { error: deleteError.message };
  }

  await supabase.auth.signOut();

  return { success: true as const };
}
