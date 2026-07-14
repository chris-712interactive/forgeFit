import { getCatalogExerciseById, searchCatalog } from "@forgefit/exercise-db";
import { MAX_CUSTOM_EXERCISES } from "./session-source";

export interface ParsedWorkoutExercise {
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
}

export interface ParsedWorkoutTemplate {
  name: string;
  exercises: ParsedWorkoutExercise[];
}

export interface WorkoutCsvParseResult {
  workout: ParsedWorkoutTemplate | null;
  errors: string[];
  warnings: string[];
}

const HEADER_MARKER = "# forgerep-workout-template v1";

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function parseKeyValueRow(line: string): { key: string; value: string } | null {
  const cells = parseCsvLine(line);
  if (cells.length < 2) return null;
  return { key: cells[0]!.toLowerCase(), value: cells[1]! };
}

function resolveExerciseId(
  exerciseId: string | undefined,
  exerciseName: string | undefined
): { id: string; name: string } | null {
  if (exerciseId) {
    const catalog = getCatalogExerciseById(exerciseId);
    if (catalog) {
      return { id: catalog.id, name: catalog.name };
    }
  }

  if (!exerciseName) return null;

  const needle = exerciseName.trim().toLowerCase();
  const matches = searchCatalog({ q: exerciseName, limit: 5 });
  const exact = matches.find((row) => row.name.toLowerCase() === needle);
  if (exact) {
    return { id: exact.id, name: exact.name };
  }

  if (matches[0]) {
    return { id: matches[0].id, name: matches[0].name };
  }

  return null;
}

export function parseForgeRepWorkoutCsv(csvText: string): WorkoutCsvParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  if (lines.length === 0) {
    return { workout: null, errors: ["CSV is empty."], warnings };
  }

  const headerLine = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.toLowerCase().includes("forgerep-workout-template"));

  if (!headerLine || !headerLine.toLowerCase().includes("forgerep-workout-template")) {
    return {
      workout: null,
      errors: [
        `Missing header. Export or create a file starting with "${HEADER_MARKER}".`,
      ],
      warnings,
    };
  }

  let workoutName = "Imported workout";
  const exercises: ParsedWorkoutExercise[] = [];
  let current: Partial<ParsedWorkoutExercise> | null = null;

  function flushCurrent() {
    if (!current) return;
    const resolved = resolveExerciseId(current.exerciseId, current.name);
    if (!resolved) {
      errors.push(
        `Unknown exercise: ${current.exerciseId ?? current.name ?? "unnamed"}.`
      );
      current = null;
      return;
    }

    const sets = current.sets ?? 3;
    const reps = current.reps ?? "8-12";
    const restSeconds = current.restSeconds ?? 90;

    if (!Number.isFinite(sets) || sets < 1 || sets > 10) {
      errors.push(`Invalid sets for ${resolved.name}. Use 1–10.`);
      current = null;
      return;
    }

    exercises.push({
      exerciseId: resolved.id,
      name: resolved.name,
      sets,
      reps,
      restSeconds,
    });
    current = null;
  }

  for (const line of lines) {
    const row = parseKeyValueRow(line);
    if (!row) continue;

    if (row.key === "workout_name") {
      flushCurrent();
      workoutName = row.value || workoutName;
      continue;
    }

    if (row.key === "exercise_id") {
      flushCurrent();
      current = { exerciseId: row.value };
      continue;
    }

    if (!current) continue;

    if (row.key === "exercise_name") {
      current.name = row.value;
    } else if (row.key === "sets") {
      current.sets = Number(row.value);
    } else if (row.key === "reps") {
      current.reps = row.value;
    } else if (row.key === "rest_seconds") {
      current.restSeconds = Number(row.value);
    }
  }

  flushCurrent();

  if (exercises.length === 0) {
    return {
      workout: null,
      errors: errors.length > 0 ? errors : ["No exercises found in CSV."],
      warnings,
    };
  }

  if (exercises.length > MAX_CUSTOM_EXERCISES) {
    return {
      workout: null,
      errors: [`Too many exercises (${exercises.length}). Maximum is ${MAX_CUSTOM_EXERCISES}.`],
      warnings,
    };
  }

  return {
    workout: { name: workoutName, exercises },
    errors,
    warnings,
  };
}

export function buildForgeRepWorkoutTemplateCsv(input: {
  name: string;
  exercises: ParsedWorkoutExercise[];
}): string {
  const lines = [
    HEADER_MARKER,
    `workout_name,${input.name}`,
    "",
  ];

  for (const exercise of input.exercises) {
    lines.push(`exercise_id,${exercise.exerciseId}`);
    lines.push(`exercise_name,${exercise.name}`);
    lines.push(`sets,${exercise.sets}`);
    lines.push(`reps,${exercise.reps}`);
    lines.push(`rest_seconds,${exercise.restSeconds}`);
    lines.push("");
  }

  return lines.join("\n");
}
