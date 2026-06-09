"use server";

import { createClient } from "@/lib/supabase/server";
import { normalizeUnitSystem, type UnitSystem } from "@/lib/units/measurements";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const unitSchema = z.enum(["metric", "imperial"]);

export async function updateUnitSystem(unit: UnitSystem) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const parsed = unitSchema.safeParse(unit);
  if (!parsed.success) {
    return { error: "Invalid unit system" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ unit_system: parsed.data })
    .eq("id", user.id);

  if (error) {
    return {
      error: error.message.includes("unit_system")
        ? "Apply the unit_system migration on profiles."
        : error.message,
    };
  }

  revalidatePath("/profile");
  revalidatePath("/progress");
  revalidatePath("/workout");

  return { unit: normalizeUnitSystem(parsed.data) };
}
