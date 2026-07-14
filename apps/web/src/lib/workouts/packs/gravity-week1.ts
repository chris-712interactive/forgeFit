import type {
  IntervalProtocol,
  WorkoutTemplateExercise,
} from "@forgefit/offline-sync";

export interface GravityPackTemplate {
  name: string;
  exercises: WorkoutTemplateExercise[];
  intervalProtocol: IntervalProtocol;
}

function custom(
  name: string,
  sets: number,
  reps: string,
  restSeconds: number,
  groupId?: string
): WorkoutTemplateExercise {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 64);
  return {
    exerciseId: `custom:${slug}`,
    name,
    sets,
    reps,
    restSeconds,
    groupId,
  };
}

/** Gravity Transformations — Week 1 (Full Body, Cardio, Metcon). */
export const GRAVITY_WEEK1_TEMPLATES: GravityPackTemplate[] = [
  {
    name: "Gravity W1 Full Body",
    intervalProtocol: {
      mode: "density",
      workSeconds: 30,
      restSeconds: 45,
      rounds: 4,
    },
    exercises: [
      custom("Barbell Squat", 4, "AMRAP", 45),
      custom("Dumbbell Reverse Lunges", 4, "AMRAP", 45),
      custom("Conventional Barbell Deadlift", 4, "AMRAP", 45),
      custom("Zercher Med Ball Step Ups", 4, "AMRAP", 45),
      custom("Med Ball Glute Bridge", 4, "AMRAP", 45),
      custom("Standing Dumbbell Press", 4, "AMRAP", 45),
      custom("Reverse Grip Cable Pulldowns", 4, "AMRAP", 45),
      custom("Flat Dumbbell Bench", 4, "AMRAP", 45),
      custom("Dumbbell Suitcase Rows", 4, "AMRAP", 45),
      custom("TRX IYTs", 4, "AMRAP", 45),
    ],
  },
  {
    name: "Gravity W1 Cardio Acceleration",
    intervalProtocol: {
      mode: "tabata",
      workSeconds: 10,
      restSeconds: 10,
      rounds: 10,
      betweenExerciseRestSeconds: 45,
    },
    exercises: [
      custom("Med Ball Slam to Sprawl", 10, "AMRAP", 10),
      custom("TRX Drop Squats", 10, "AMRAP", 10),
      custom("Single Leg Bear Crawl Sprint", 10, "AMRAP", 10),
      custom("Jumping Double Rope Slam", 10, "AMRAP", 10),
      custom("Lateral Box Step Overs", 10, "AMRAP", 10),
      custom("Knees to Elbows Push Ups", 10, "AMRAP", 10),
      custom("Med Ball Russian Twists", 10, "AMRAP", 10),
      custom("Sit Outs", 10, "AMRAP", 10),
      custom("Speed Ladder Muhammad Alis", 10, "AMRAP", 10),
      custom("Alternating V Sit Ups", 10, "AMRAP", 10),
      custom("Groiners", 10, "AMRAP", 10),
      custom("Reverse Lunge to Single Leg Jump", 10, "AMRAP", 10),
    ],
  },
  {
    name: "Gravity W1 Metabolic Conditioning",
    intervalProtocol: {
      mode: "superset_block",
      workSeconds: 300,
      restSeconds: 120,
      rounds: 1,
    },
    exercises: [
      custom("DB Cuban Press to Back Lunge", 5, "10", 120, "A"),
      custom("Navy Seal Situps", 5, "10", 120, "A"),
      custom("Elevated DB/Sumo Squat", 5, "10", 120, "B"),
      custom("Squat Jumps", 5, "10", 120, "B"),
      custom("Incline DB Press", 5, "10", 120, "C"),
      custom("Pushup Mountain Climbers", 5, "5", 120, "C"),
      custom("KB Deadlift from Platform", 5, "10", 120, "D"),
      custom("KB Alternating Swings", 5, "20", 120, "D"),
      custom("Reverse DB Press", 5, "10", 120, "E"),
      custom("Plank", 5, "30 sec", 120, "E"),
      custom("TRX Pistol Squats", 5, "10", 120, "F"),
      custom("KB Single RDL", 5, "10", 120, "F"),
      custom("Neutral Grip Rows", 5, "10", 120, "G"),
      custom("KB Clean & Press", 5, "10", 120, "G"),
    ],
  },
];

export const GRAVITY_WEEK1_TEMPLATE_NAMES = GRAVITY_WEEK1_TEMPLATES.map(
  (row) => row.name
);
