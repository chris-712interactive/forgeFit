"use server";

import {
  enterTravelMode as enterTravelModeService,
  exitTravelMode as exitTravelModeService,
  replaceUserEquipment,
} from "@/lib/equipment/service";
import { generateAndSaveProgram } from "@/lib/programs/service";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const equipmentSchema = z.object({
  equipment: z.array(z.string()).min(1),
  equipmentLocation: z.enum(["home", "gym", "both"]),
  recoveryEquipment: z.array(z.string()),
  regenerateProgram: z.boolean().optional(),
});

function revalidateEquipmentPaths() {
  revalidatePath("/profile");
  revalidatePath("/workout");
  revalidatePath("/home");
  revalidatePath("/exercises");
}

export async function saveUserEquipment(
  equipment: string[],
  equipmentLocation: "home" | "gym" | "both",
  recoveryEquipment: string[],
  regenerateProgram = false
) {
  const parsed = equipmentSchema.safeParse({
    equipment,
    equipmentLocation,
    recoveryEquipment,
    regenerateProgram,
  });
  if (!parsed.success) {
    return { error: "Select at least one piece of training equipment." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_travel_mode")
    .eq("id", user.id)
    .single();

  const isTravelMode = Boolean(profile?.is_travel_mode);

  const replaceResult = await replaceUserEquipment(
    supabase,
    user.id,
    {
      equipment: parsed.data.equipment,
      equipmentLocation: parsed.data.equipmentLocation,
      recoveryEquipment: parsed.data.recoveryEquipment,
    },
    {
      updateHomeSnapshot: !isTravelMode,
      isTravelMode: isTravelMode ? true : false,
    }
  );

  if (replaceResult.error) {
    return { error: replaceResult.error };
  }

  if (parsed.data.regenerateProgram) {
    const programResult = await generateAndSaveProgram(user.id);
    if ("error" in programResult) {
      return { error: programResult.error };
    }
  }

  revalidateEquipmentPaths();
  return { success: true as const };
}

export async function enterTravelMode(regenerateProgram = false) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const result = await enterTravelModeService(user.id);
  if (result.error) {
    return { error: result.error };
  }

  if (regenerateProgram) {
    const programResult = await generateAndSaveProgram(user.id);
    if ("error" in programResult) {
      return { error: programResult.error };
    }
  }

  revalidateEquipmentPaths();
  return { success: true as const };
}

export async function exitTravelMode(regenerateProgram = false) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const result = await exitTravelModeService(user.id);
  if (result.error) {
    return { error: result.error };
  }

  if (regenerateProgram) {
    const programResult = await generateAndSaveProgram(user.id);
    if ("error" in programResult) {
      return { error: programResult.error };
    }
  }

  revalidateEquipmentPaths();
  return { success: true as const };
}
