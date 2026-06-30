"use server";

import {
  enterTravelMode as enterTravelModeService,
  exitTravelMode as exitTravelModeService,
  replaceUserEquipment,
} from "@/lib/equipment/service";
import { generateAndSaveProgram } from "@/lib/programs/service";
import {
  resolveProgramStartDate,
  SCHEDULE_START_DATE_SCHEMA,
} from "@/lib/programs/start-date";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const equipmentSchema = z.object({
  equipment: z.array(z.string()).min(1),
  equipmentLocation: z.enum(["home", "gym", "both"]),
  recoveryEquipment: z.array(z.string()),
  regenerateProgram: z.boolean().optional(),
  schedule_start_date: z.string().regex(SCHEDULE_START_DATE_SCHEMA).optional(),
});

function revalidateEquipmentPaths() {
  revalidatePath("/profile");
  revalidatePath("/workout");
  revalidatePath("/home");
  revalidatePath("/exercises");
}

async function regenerateWithStartDate(
  userId: string,
  scheduleStartDate?: string
) {
  const start = resolveProgramStartDate(scheduleStartDate);
  if ("error" in start) {
    return { error: start.error };
  }

  const programResult = await generateAndSaveProgram(userId, null, {
    startDate: start.startDate,
  });
  if ("error" in programResult) {
    return { error: programResult.error };
  }

  return { success: true as const };
}

export async function saveUserEquipment(
  equipment: string[],
  equipmentLocation: "home" | "gym" | "both",
  recoveryEquipment: string[],
  regenerateProgram = false,
  scheduleStartDate?: string
) {
  const parsed = equipmentSchema.safeParse({
    equipment,
    equipmentLocation,
    recoveryEquipment,
    regenerateProgram,
    schedule_start_date: scheduleStartDate,
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
    const programResult = await regenerateWithStartDate(
      user.id,
      parsed.data.schedule_start_date
    );
    if ("error" in programResult) {
      return programResult;
    }
  }

  revalidateEquipmentPaths();
  return { success: true as const };
}

export async function enterTravelMode(
  regenerateProgram = false,
  scheduleStartDate?: string
) {
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
    const programResult = await regenerateWithStartDate(
      user.id,
      scheduleStartDate
    );
    if ("error" in programResult) {
      return programResult;
    }
  }

  revalidateEquipmentPaths();
  return { success: true as const };
}

export async function exitTravelMode(
  regenerateProgram = false,
  scheduleStartDate?: string
) {
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
    const programResult = await regenerateWithStartDate(
      user.id,
      scheduleStartDate
    );
    if ("error" in programResult) {
      return programResult;
    }
  }

  revalidateEquipmentPaths();
  return { success: true as const };
}
