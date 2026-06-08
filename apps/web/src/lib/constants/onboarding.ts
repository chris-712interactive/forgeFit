import type { ExperienceLevel, FitnessGoal } from "@/lib/types/profile";

export const FITNESS_GOALS: {
  value: FitnessGoal;
  label: string;
  description: string;
}[] = [
  {
    value: "fat_loss",
    label: "Fat Loss",
    description: "Lose weight while keeping muscle with evidence-based training",
  },
  {
    value: "bodybuilding",
    label: "Bodybuilding",
    description: "Maximize muscle size with hypertrophy-focused programming",
  },
  {
    value: "powerlifting",
    label: "Powerlifting",
    description: "Build squat, bench, and deadlift strength",
  },
  {
    value: "general_strength",
    label: "General Strength",
    description: "Get stronger for everyday life and sport",
  },
  {
    value: "recomposition",
    label: "Recomposition",
    description: "Build muscle and lose fat at the same time",
  },
];

export const EXPERIENCE_LEVELS: {
  value: ExperienceLevel;
  label: string;
  description: string;
}[] = [
  {
    value: "beginner",
    label: "Beginner",
    description: "New to training or returning after a long break",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    description: "6+ months of consistent training",
  },
  {
    value: "advanced",
    label: "Advanced",
    description: "2+ years with solid technique on major lifts",
  },
];

export const GYM_EQUIPMENT = [
  { value: "barbell", label: "Barbell" },
  { value: "dumbbells", label: "Dumbbells" },
  { value: "cables", label: "Cable Machine" },
  { value: "machines", label: "Weight Machines" },
  { value: "pull_up_bar", label: "Pull-up Bar" },
  { value: "bench", label: "Flat/Incline Bench" },
  { value: "squat_rack", label: "Squat Rack" },
  { value: "resistance_bands", label: "Resistance Bands" },
  { value: "kettlebells", label: "Kettlebells" },
  { value: "cardio_machines", label: "Cardio Machines" },
  { value: "bodyweight_only", label: "Bodyweight Only" },
] as const;

export const RECOVERY_EQUIPMENT = [
  { value: "foam_roller", label: "Foam Roller" },
  { value: "lacrosse_ball", label: "Lacrosse Ball" },
  { value: "massage_gun", label: "Massage Gun" },
  { value: "resistance_bands", label: "Resistance Bands" },
  { value: "yoga_mat", label: "Yoga Mat" },
  { value: "compression_gear", label: "Compression Gear" },
  { value: "sauna", label: "Sauna Access" },
] as const;

export const SESSIONS_PER_WEEK_OPTIONS = [2, 3, 4, 5, 6];
export const MINUTES_PER_SESSION_OPTIONS = [20, 30, 45, 60, 75, 90];
