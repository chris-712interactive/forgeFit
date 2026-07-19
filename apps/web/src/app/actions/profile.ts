"use server";

import { createClient } from "@/lib/supabase/server";
import { normalizeUnitSystem, type UnitSystem } from "@/lib/units/measurements";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getImpersonationMutationBlock } from "@/lib/auth/member-context";
import {
  FEATURE_SAVE_TEMPORARILY_UNAVAILABLE,
  memberFacingSchemaError,
} from "@/lib/ui/member-errors";

const unitSchema = z.enum(["metric", "imperial"]);

export async function updateUnitSystem(unit: UnitSystem) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }
  const impersonationBlock = await getImpersonationMutationBlock();
  if (impersonationBlock) return impersonationBlock;


  const parsed = unitSchema.safeParse(unit);
  if (!parsed.success) {
    return { error: "Invalid unit system" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ unit_system: parsed.data })
    .eq("id", user.id);

  if (error) {
    console.error("updateUnitSystem:", error.message);
    return {
      error: error.message.includes("unit_system")
        ? FEATURE_SAVE_TEMPORARILY_UNAVAILABLE
        : memberFacingSchemaError(error.message),
    };
  }

  revalidatePath("/profile");
  revalidatePath("/progress");
  revalidatePath("/workout");

  return { unit: normalizeUnitSystem(parsed.data) };
}
