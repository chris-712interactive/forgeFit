export type FitnessGoal =
  | "fat_loss"
  | "bodybuilding"
  | "powerlifting"
  | "general_strength"
  | "recomposition"
  | "sport_performance";

export type SportSeasonPhase = "in_season" | "off_season" | "general_prep";

export type SportPracticeGymPolicy = "avoid" | "allow_light" | "allow";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export type SexType = "male" | "female" | "other" | "prefer_not_to_say";

export type EquipmentLocation = "home" | "gym" | "both";

export type UnitSystem = "metric" | "imperial";

export type FatLossPace = "steady" | "moderate" | "aggressive";

export type RecompPriority = "muscle" | "balanced" | "lean_out";

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  sex: SexType | null;
  age: number | null;
  experience_level: ExperienceLevel | null;
  primary_goal: FitnessGoal | null;
  sport_id: string | null;
  sport_position_id: string | null;
  sport_season_phase: SportSeasonPhase | null;
  sport_practice_days: number[] | null;
  sport_practice_gym_policy: SportPracticeGymPolicy | null;
  sport_practice_schedule_varies: boolean;
  secondary_goal: FitnessGoal | null;
  parent_consent_at: string | null;
  parent_consent_name: string | null;
  parent_consent_email: string | null;
  fat_loss_pace: FatLossPace | null;
  recomp_priority: RecompPriority | null;
  goal_weight_kg: number | null;
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
  signup_source: string | null;
  subscription_tier?: "free" | "pro" | "pro_plus";
  subscription_status?:
    | "inactive"
    | "trialing"
    | "active"
    | "past_due"
    | "canceled";
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  subscription_current_period_end?: string | null;
  is_travel_mode?: boolean;
  home_equipment_types?: string[];
  home_recovery_equipment_types?: string[];
  home_equipment_location?: EquipmentLocation | null;
  created_at: string;
  updated_at: string;
}

export interface OnboardingData {
  primary_goal: FitnessGoal;
  sport_category_id?: string;
  sport_id?: string;
  sport_position_id?: string;
  sport_season_phase?: SportSeasonPhase;
  sport_practice_days?: number[];
  sport_practice_gym_policy?: SportPracticeGymPolicy;
  sport_practice_schedule_varies?: boolean;
  secondary_goal?: FitnessGoal;
  parent_consent_name?: string;
  parent_consent_email?: string;
  parent_consent_acknowledged?: boolean;
  fat_loss_pace?: FatLossPace;
  recomp_priority?: RecompPriority;
  goal_weight_kg?: number;
  experience_level: ExperienceLevel;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  sex: SexType;
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
  signup_source?: string;
}
