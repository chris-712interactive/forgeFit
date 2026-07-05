"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getImpersonationMutationBlock } from "@/lib/auth/member-context";

const disclaimerSchema = z.object({
  health_disclaimer_accepted: z.literal(true),
});

export async function acceptHealthDisclaimer(input: {
  health_disclaimer_accepted: boolean;
}) {
  const parsed = disclaimerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "You must accept the health disclaimer to continue." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      health_disclaimer_accepted_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/home");
  revalidatePath("/disclaimer");
  redirect("/home");
}
