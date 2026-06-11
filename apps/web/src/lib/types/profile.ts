export type FitnessGoal =
  | "fat_loss"
  | "bodybuilding"
  | "powerlifting"
  | "general_strength"
  | "recomposition";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export type SexType = "male" | "female" | "other" | "prefer_not_to_say";

export type EquipmentLocation = "home" | "gym" | "both";

export type UnitSystem = "metric" | "imperial";

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  sex: SexType | null;
  age: number | null;
  experience_level: ExperienceLevel | null;
  primary_goal: FitnessGoal | null;
  sessions_per_week: number | null;
  minutes_per_session: number | null;
  why_started: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  waist_cm: number | null;
  chest_cm: number | null;
  arms_cm: number | null;
  legs_cm: number | null;
  neck_cm: number | null;
  hips_cm: number | null;
  onboarding_complete: boolean;
  health_disclaimer_accepted_at: string | null;
  gamification_opt_in: boolean;
  unit_system: UnitSystem;
  experience_promoted_at: string | null;
  promotion_snoozed_until: string | null;
  is_travel_mode?: boolean;
  home_equipment_types?: string[];
  home_recovery_equipment_types?: string[];
  home_equipment_location?: EquipmentLocation | null;
  created_at: string;
  updated_at: string;
}

export interface OnboardingData {
  primary_goal: FitnessGoal;
  experience_level: ExperienceLevel;
  sex: SexType;
  age: number;
  height_cm: number;
  weight_kg: number;
  waist_cm?: number;
  chest_cm?: number;
  arms_cm?: number;
  legs_cm?: number;
  neck_cm?: number;
  hips_cm?: number;
  equipment: string[];
  equipment_location: EquipmentLocation;
  recovery_equipment: string[];
  sessions_per_week: number;
  minutes_per_session: number;
  why_started: string;
  health_disclaimer_accepted: boolean;
}
