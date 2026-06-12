"use server";

import { replaceUserEquipment } from "@/lib/equipment/service";
import {
  computeAgeFromDateOfBirth,
  isValidDateOfBirth,
  profileFullName,
} from "@/lib/profile/identity";
import { generateAndSaveProgram } from "@/lib/programs/service";
import { createClient } from "@/lib/supabase/server";
import type { OnboardingData } from "@/lib/types/profile";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const onboardingSchema = z.object({
  primary_goal: z.enum([
    "fat_loss",
    "bodybuilding",
    "powerlifting",
    "general_strength",
    "recomposition",
  ]),
  experience_level: z.enum(["beginner", "intermediate", "advanced"]),
  first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().min(1).max(80),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date of birth."),
  sex: z.enum(["male", "female", "other", "prefer_not_to_say"]),
  height_cm: z.number().min(100).max(250),
  weight_kg: z.number().min(30).max(300),
  waist_cm: z.number().optional(),
  chest_cm: z.number().optional(),
  arms_cm: z.number().optional(),
  legs_cm: z.number().optional(),
  neck_cm: z.number().optional(),
  hips_cm: z.number().optional(),
  equipment: z.array(z.string()).min(1),
  equipment_location: z.enum(["home", "gym", "both"]),
  recovery_equipment: z.array(z.string()),
  sessions_per_week: z.number().min(1).max(7),
  minutes_per_session: z.number().min(15).max(120),
  why_started: z.string().min(10).max(500),
  health_disclaimer_accepted: z.literal(true),
});

export async function completeOnboarding(data: OnboardingData) {
  const parsed = onboardingSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Please check your answers and try again." };
  }

  if (!isValidDateOfBirth(parsed.data.date_of_birth)) {
    return { error: "You must be at least 13 years old to use ForgeRep." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const {
    equipment,
    equipment_location,
    recovery_equipment,
    health_disclaimer_accepted: _disclaimerAccepted,
    first_name,
    last_name,
    date_of_birth,
    ...profileFields
  } = parsed.data;

  const age = computeAgeFromDateOfBirth(date_of_birth);
  const display_name =
    profileFullName({ first_name, last_name }) ?? `${first_name} ${last_name}`;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      ...profileFields,
      first_name,
      last_name,
      date_of_birth,
      display_name,
      age,
      onboarding_complete: true,
      health_disclaimer_accepted_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  const equipmentResult = await replaceUserEquipment(
    supabase,
    user.id,
    {
      equipment,
      equipmentLocation: equipment_location,
      recoveryEquipment: recovery_equipment,
    },
    { updateHomeSnapshot: true }
  );
  if (equipmentResult.error) {
    return { error: equipmentResult.error };
  }

  await generateAndSaveProgram(user.id);

  revalidatePath("/home");
  redirect("/home");
}
