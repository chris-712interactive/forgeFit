import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const source = JSON.parse(
  readFileSync(join(__dirname, "../data/source-exercises.json"), "utf8")
);

const EQUIPMENT_MAP = {
  "body only": ["bodyweight_only"],
  dumbbell: ["dumbbells"],
  barbell: ["barbell"],
  machine: ["machines"],
  cable: ["cables"],
  kettlebells: ["kettlebells"],
  bands: ["resistance_bands"],
  "e-z curl bar": ["barbell"],
  "exercise ball": ["bodyweight_only"],
  "foam roll": ["bodyweight_only"],
  "medicine ball": ["bodyweight_only"],
  other: ["bodyweight_only"],
  null: ["bodyweight_only"],
};

const MUSCLE_MAP = {
  abdominals: "core",
  abductors: "glutes",
  adductors: "glutes",
  biceps: "biceps",
  calves: "calves",
  chest: "chest",
  forearms: "forearms",
  glutes: "glutes",
  hamstrings: "hamstrings",
  lats: "back",
  "lower back": "back",
  "middle back": "back",
  neck: "neck",
  quadriceps: "quadriceps",
  shoulders: "shoulders",
  traps: "back",
  triceps: "triceps",
};

const HIGHLIGHTER_MAP = {
  core: ["abs", "obliques"],
  biceps: ["biceps"],
  calves: ["calves"],
  chest: ["chest"],
  forearms: ["forearm"],
  glutes: ["gluteal"],
  hamstrings: ["hamstring"],
  back: ["upper-back", "lower-back", "trapezius"],
  neck: ["trapezius"],
  quadriceps: ["quadriceps"],
  shoulders: ["deltoids"],
  triceps: ["triceps"],
  cardio: [],
};

function slugify(id) {
  return id
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function mapMuscles(muscles) {
  return [...new Set(muscles.map((m) => MUSCLE_MAP[m] ?? m))];
}

function inferPattern(name, muscles, category, mechanic) {
  const n = name.toLowerCase();
  if (category === "cardio" || /treadmill|bike|run|walk|elliptical|rower/.test(n)) {
    return "cardio";
  }
  if (/squat|leg press|hack squat/.test(n)) return "squat";
  if (/deadlift|good morning|hip hinge|back extension/.test(n)) return "hinge";
  if (/bench|push-up|pushup|fly|dip|press \(/.test(n) && !/overhead|shoulder|military|leg|tricep/.test(n)) {
    return "horizontal_push";
  }
  if (/overhead|shoulder press|military press|arnold/.test(n)) return "vertical_push";
  if (/pull-up|chin-up|pulldown|lat pull/.test(n)) return "vertical_pull";
  if (/row|pullover/.test(n)) return "horizontal_pull";
  if (/lunge|split squat|step-up|step up/.test(n)) return "lunge";
  if (/carry|farmer/.test(n)) return "carry";
  if (/curl|tricep|extension|skull crusher|pushdown|kickback/.test(n)) {
    return "isolation_arms";
  }
  if (/leg curl|leg extension|calf|adductor|abductor/.test(n)) {
    return "isolation_legs";
  }
  if (/plank|crunch|sit-up|situp|ab |abs |core|twist|rollout/.test(n)) {
    return "core";
  }

  const primary = mapMuscles(muscles);
  if (primary.includes("quadriceps") || primary.includes("glutes")) {
    return mechanic === "isolation" ? "isolation_legs" : "squat";
  }
  if (primary.includes("chest") || primary.includes("triceps")) return "horizontal_push";
  if (primary.includes("shoulders")) return "vertical_push";
  if (primary.includes("back")) return "horizontal_pull";
  if (primary.includes("biceps")) return "isolation_arms";
  if (primary.includes("core")) return "core";
  if (primary.includes("hamstrings")) return "hinge";

  return category === "stretching" ? "core" : "core";
}

function mapEquipment(raw, name) {
  const key = (raw ?? "body only").toLowerCase();
  const base = EQUIPMENT_MAP[key] ?? ["bodyweight_only"];
  const gear = new Set(base);
  const n = name.toLowerCase();

  if (n.includes("bench press") || n.includes("bench fly")) {
    gear.add("bench");
  }
  if (n.includes("squat") && gear.has("barbell")) {
    gear.add("squat_rack");
  }
  if (n.includes("pull-up") || n.includes("chin-up")) {
    gear.add("pull_up_bar");
  }

  return [...gear];
}

function mapDifficulty(level) {
  if (level === "intermediate") return "intermediate";
  if (level === "expert") return "advanced";
  return "beginner";
}

function priorityFor(mechanic, category) {
  if (category === "cardio" || category === "stretching") return 2;
  if (mechanic === "compound") return 8;
  if (mechanic === "isolation") return 5;
  return 6;
}

const catalog = source.map((item) => {
  const primaryMuscles = mapMuscles(item.primaryMuscles ?? []);
  const secondaryMuscles = mapMuscles(item.secondaryMuscles ?? []);
  const movementPattern = inferPattern(
    item.name,
    item.primaryMuscles ?? [],
    item.category,
    item.mechanic
  );

  const highlightMuscles = [
    ...new Set(
      [...primaryMuscles, ...secondaryMuscles].flatMap(
        (muscle) => HIGHLIGHTER_MAP[muscle] ?? []
      )
    ),
  ];

  return {
    id: slugify(item.id),
    sourceId: item.id,
    name: item.name,
    movementPattern,
    primaryMuscles,
    secondaryMuscles,
    equipment: mapEquipment(item.equipment, item.name),
    difficulty: mapDifficulty(item.level),
    priority: priorityFor(item.mechanic, item.category),
    category: item.category,
    mechanic: item.mechanic,
    instructions: item.instructions ?? [],
    imagePaths: item.images ?? [],
    highlightMuscles,
  };
});

writeFileSync(
  join(__dirname, "../data/catalog.json"),
  JSON.stringify(catalog),
  "utf8"
);

console.log(`Wrote ${catalog.length} catalog exercises`);
