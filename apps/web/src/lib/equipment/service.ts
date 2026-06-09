import {
  GYM_EQUIPMENT,
  RECOVERY_EQUIPMENT,
} from "@/lib/constants/onboarding";
import { createClient } from "@/lib/supabase/server";
import type { EquipmentLocation } from "@/lib/types/profile";
import type { SupabaseClient } from "@supabase/supabase-js";

export const TRAVEL_EQUIPMENT_DEFAULTS = [
  "bodyweight_only",
  "resistance_bands",
] as const;

const GYM_EQUIPMENT_VALUES = new Set<string>(
  GYM_EQUIPMENT.map((item) => item.value)
);
const RECOVERY_EQUIPMENT_VALUES = new Set<string>(
  RECOVERY_EQUIPMENT.map((item) => item.value)
);

export interface UserEquipmentSettings {
  equipment: string[];
  equipmentLocation: EquipmentLocation;
  recoveryEquipment: string[];
  isTravelMode: boolean;
  homeEquipment: string[];
  homeRecoveryEquipment: string[];
  homeEquipmentLocation: EquipmentLocation | null;
  travelModeReady: boolean;
}

export interface ReplaceUserEquipmentInput {
  equipment: string[];
  equipmentLocation: EquipmentLocation;
  recoveryEquipment: string[];
}

function isTravelModeSchemaError(message: string): boolean {
  return (
    message.includes("is_travel_mode") ||
    message.includes("home_equipment_types") ||
    message.includes("home_recovery_equipment_types") ||
    message.includes("home_equipment_location")
  );
}

function normalizeEquipment(values: string[]): string[] {
  return [...new Set(values)]
    .filter((value) => GYM_EQUIPMENT_VALUES.has(value))
    .sort();
}

function normalizeRecoveryEquipment(values: string[]): string[] {
  return [...new Set(values)]
    .filter((value) => RECOVERY_EQUIPMENT_VALUES.has(value))
    .sort();
}

export async function replaceUserEquipment(
  supabase: SupabaseClient,
  userId: string,
  input: ReplaceUserEquipmentInput,
  options?: {
    updateHomeSnapshot?: boolean;
    isTravelMode?: boolean;
  }
): Promise<{ error?: string }> {
  const equipment = normalizeEquipment(input.equipment);
  const recoveryEquipment = normalizeRecoveryEquipment(input.recoveryEquipment);

  if (equipment.length === 0) {
    return { error: "Select at least one piece of training equipment." };
  }

  await supabase.from("equipment_inventory").delete().eq("user_id", userId);
  const { error: equipError } = await supabase.from("equipment_inventory").insert(
    equipment.map((equipment_type) => ({
      user_id: userId,
      equipment_type,
      location: input.equipmentLocation,
    }))
  );
  if (equipError) {
    return { error: equipError.message };
  }

  await supabase.from("recovery_equipment").delete().eq("user_id", userId);
  if (recoveryEquipment.length > 0) {
    const { error: recoveryError } = await supabase
      .from("recovery_equipment")
      .insert(
        recoveryEquipment.map((equipment_type) => ({
          user_id: userId,
          equipment_type,
        }))
      );
    if (recoveryError) {
      return { error: recoveryError.message };
    }
  }

  if (options?.updateHomeSnapshot || options?.isTravelMode !== undefined) {
    const profileUpdate: Record<string, unknown> = {};
    if (options.updateHomeSnapshot) {
      profileUpdate.home_equipment_types = equipment;
      profileUpdate.home_recovery_equipment_types = recoveryEquipment;
      profileUpdate.home_equipment_location = input.equipmentLocation;
      profileUpdate.is_travel_mode = false;
    }
    if (options.isTravelMode !== undefined) {
      profileUpdate.is_travel_mode = options.isTravelMode;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("id", userId);

    if (profileError) {
      if (isTravelModeSchemaError(profileError.message)) {
        return {
          error:
            "Apply the equipment_travel_mode migration in Supabase to use travel mode.",
        };
      }
      return { error: profileError.message };
    }
  }

  return {};
}

export async function getUserEquipmentSettings(
  userId: string
): Promise<UserEquipmentSettings> {
  const supabase = await createClient();

  const [{ data: equipmentRows }, { data: recoveryRows }, profileResult] =
    await Promise.all([
      supabase
        .from("equipment_inventory")
        .select("equipment_type, location")
        .eq("user_id", userId),
      supabase
        .from("recovery_equipment")
        .select("equipment_type")
        .eq("user_id", userId),
      supabase
        .from("profiles")
        .select(
          "is_travel_mode, home_equipment_types, home_recovery_equipment_types, home_equipment_location"
        )
        .eq("id", userId)
        .single(),
    ]);

  const profile = profileResult.data;
  const profileErrorMessage = profileResult.error?.message ?? "";
  const travelModeReady =
    profile != null && !isTravelModeSchemaError(profileErrorMessage);

  const equipment = normalizeEquipment(
    equipmentRows?.map((row) => row.equipment_type) ?? []
  );
  const recoveryEquipment = normalizeRecoveryEquipment(
    recoveryRows?.map((row) => row.equipment_type) ?? []
  );
  const equipmentLocation =
    (equipmentRows?.[0]?.location as EquipmentLocation | undefined) ?? "gym";

  if (!travelModeReady || !profile) {
    return {
      equipment,
      equipmentLocation,
      recoveryEquipment,
      isTravelMode: false,
      homeEquipment: equipment,
      homeRecoveryEquipment: recoveryEquipment,
      homeEquipmentLocation: equipmentLocation,
      travelModeReady: false,
    };
  }

  return {
    equipment,
    equipmentLocation,
    recoveryEquipment,
    isTravelMode: Boolean(profile.is_travel_mode),
    homeEquipment: normalizeEquipment(profile.home_equipment_types ?? []),
    homeRecoveryEquipment: normalizeRecoveryEquipment(
      profile.home_recovery_equipment_types ?? []
    ),
    homeEquipmentLocation:
      (profile.home_equipment_location as EquipmentLocation | null) ?? null,
    travelModeReady: true,
  };
}

export async function enterTravelMode(
  userId: string
): Promise<{ error?: string; settings?: UserEquipmentSettings }> {
  const supabase = await createClient();
  const current = await getUserEquipmentSettings(userId);

  if (!current.travelModeReady) {
    return {
      error:
        "Apply the equipment_travel_mode migration in Supabase to use travel mode.",
    };
  }

  if (current.isTravelMode) {
    return { settings: current };
  }

  const homeEquipment =
    current.homeEquipment.length > 0 ? current.homeEquipment : current.equipment;
  const homeRecoveryEquipment =
    current.homeRecoveryEquipment.length > 0
      ? current.homeRecoveryEquipment
      : current.recoveryEquipment;
  const homeEquipmentLocation =
    current.homeEquipmentLocation ?? current.equipmentLocation;

  const { error: snapshotError } = await supabase
    .from("profiles")
    .update({
      is_travel_mode: true,
      home_equipment_types: homeEquipment,
      home_recovery_equipment_types: homeRecoveryEquipment,
      home_equipment_location: homeEquipmentLocation,
    })
    .eq("id", userId);

  if (snapshotError) {
    return { error: snapshotError.message };
  }

  const replaceResult = await replaceUserEquipment(
    supabase,
    userId,
    {
      equipment: [...TRAVEL_EQUIPMENT_DEFAULTS],
      equipmentLocation: "home",
      recoveryEquipment: current.recoveryEquipment.filter((item) =>
        ["yoga_mat", "resistance_bands", "foam_roller"].includes(item)
      ),
    },
    { isTravelMode: true }
  );

  if (replaceResult.error) {
    return replaceResult;
  }

  return { settings: await getUserEquipmentSettings(userId) };
}

export async function exitTravelMode(
  userId: string
): Promise<{ error?: string; settings?: UserEquipmentSettings }> {
  const supabase = await createClient();
  const current = await getUserEquipmentSettings(userId);

  if (!current.travelModeReady) {
    return {
      error:
        "Apply the equipment_travel_mode migration in Supabase to use travel mode.",
    };
  }

  if (!current.isTravelMode) {
    return { settings: current };
  }

  if (current.homeEquipment.length === 0) {
    return {
      error:
        "No home equipment saved yet. Update your equipment while at home first.",
    };
  }

  const replaceResult = await replaceUserEquipment(
    supabase,
    userId,
    {
      equipment: current.homeEquipment,
      equipmentLocation: current.homeEquipmentLocation ?? "gym",
      recoveryEquipment: current.homeRecoveryEquipment,
    },
    { updateHomeSnapshot: true }
  );

  if (replaceResult.error) {
    return replaceResult;
  }

  return { settings: await getUserEquipmentSettings(userId) };
}
