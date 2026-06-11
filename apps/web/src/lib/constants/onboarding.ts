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

export const CARDIO_EQUIPMENT = [
  { value: "treadmill", label: "Treadmill" },
  { value: "rowing_machine", label: "Rowing Machine" },
  { value: "exercise_bike", label: "Exercise Bike" },
  { value: "elliptical", label: "Elliptical" },
  { value: "stair_climber", label: "Stair Climber" },
] as const;

export const STRENGTH_EQUIPMENT = [
  { value: "barbell", label: "Barbell" },
  { value: "dumbbells", label: "Dumbbells" },
  { value: "cables", label: "Cable Machine" },
  { value: "machines", label: "Weight Machines" },
  { value: "pull_up_bar", label: "Pull-up Bar" },
  { value: "bench", label: "Flat/Incline Bench" },
  { value: "squat_rack", label: "Squat Rack" },
  { value: "resistance_bands", label: "Resistance Bands" },
  { value: "kettlebells", label: "Kettlebells" },
  { value: "bodyweight_only", label: "Bodyweight Only" },
] as const;

export const GYM_EQUIPMENT = [...STRENGTH_EQUIPMENT, ...CARDIO_EQUIPMENT] as const;

/** @deprecated Legacy value stored on older profiles — expanded on read. */
export const LEGACY_CARDIO_EQUIPMENT = "cardio_machines" as const;

export const RECOVERY_EQUIPMENT = [
  { value: "foam_roller", label: "Foam Roller" },
  { value: "lacrosse_ball", label: "Lacrosse Ball" },
  { value: "trigger_point_ball", label: "Trigger Point Ball" },
  { value: "massage_gun", label: "Massage Gun" },
  { value: "resistance_bands", label: "Resistance Bands" },
  { value: "yoga_mat", label: "Yoga Mat" },
  { value: "yoga_blocks_strap", label: "Yoga Blocks / Strap" },
  { value: "compression_gear", label: "Compression Gear" },
  { value: "compression_boots", label: "Compression Boots" },
  { value: "sauna", label: "Sauna Access" },
  { value: "steam_room", label: "Steam Room" },
  { value: "hot_tub", label: "Hot Tub" },
  { value: "cold_plunge", label: "Cold Plunge" },
  { value: "cryotherapy", label: "Cryotherapy" },
  { value: "red_light_therapy", label: "Red Light Therapy" },
  { value: "active_recovery_access", label: "Active Recovery" },
] as const;

export const SESSIONS_PER_WEEK_OPTIONS = [2, 3, 4, 5, 6];
export const MINUTES_PER_SESSION_OPTIONS = [20, 30, 45, 60, 75, 90];

export const HEALTH_DISCLAIMER = {
  title: "Before we begin",
  paragraphs: [
    "ForgeFit provides workout plans, nutrition targets, and progress estimates for informational and educational purposes only. Nothing in this app is medical advice, diagnosis, or treatment.",
    "Exercise and nutrition programs affect everyone differently. If you have any health condition, injury, are pregnant, take prescription medications, or have questions about whether this program is appropriate for you, consult a qualified physician or healthcare provider before starting.",
    "By continuing, you agree that you use ForgeFit at your own risk and that you are responsible for stopping any activity that causes pain, dizziness, or other concerning symptoms.",
  ],
  checkboxLabel:
    "I understand this is informational only and I have consulted a physician where appropriate.",
} as const;
