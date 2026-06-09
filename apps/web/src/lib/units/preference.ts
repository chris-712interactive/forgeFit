import { createClient } from "@/lib/supabase/server";
import { normalizeUnitSystem, type UnitSystem } from "./measurements";

export async function getUserUnitSystem(userId: string): Promise<UnitSystem> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("unit_system")
    .eq("id", userId)
    .single();

  if (error) return "metric";

  return normalizeUnitSystem(data?.unit_system);
}
