import { getCatalogExerciseById, searchCatalog } from "@forgefit/exercise-db";
import type { IntervalMode, IntervalProtocol } from "@forgefit/offline-sync";
import { isIntervalProtocol } from "./interval-protocol";
import { MAX_CUSTOM_EXERCISES } from "./session-source";

export interface ParsedWorkoutExercise {
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  groupId?: string;
}

export interface ParsedWorkoutTemplate {
  name: string;
  exercises: ParsedWorkoutExercise[];
  intervalProtocol?: IntervalProtocol;
}

export interface WorkoutCsvParseResult {
  workout: ParsedWorkoutTemplate | null;
  errors: string[];
  warnings: string[];
}

const HEADER_MARKER_V1 = "# forgerep-workout-template v1";
const HEADER_MARKER_V2 = "# forgerep-workout-template v2";

const VALID_MODES: IntervalMode[] = ["density", "tabata", "superset_block"];

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
  if (exerciseId?.startsWith("custom:")) {
    const name = exerciseName?.trim();
    if (!name) return null;
    return { id: exerciseId, name };
  }

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

  // Fall back to synthetic custom id so Gravity-style names still import.
  const slug = needle
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 64);
  if (!slug) return null;
  return { id: `custom:${slug}`, name: exerciseName.trim() };
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
        `Missing header. Export or create a file starting with "${HEADER_MARKER_V1}" or "${HEADER_MARKER_V2}".`,
      ],
      warnings,
    };
  }

  let workoutName = "Imported workout";
  const exercises: ParsedWorkoutExercise[] = [];
  let current: Partial<ParsedWorkoutExercise> | null = null;
  const protocolDraft: Partial<IntervalProtocol> & {
    mode?: IntervalMode;
  } = {};

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

    if (!Number.isFinite(sets) || sets < 1 || sets > 12) {
      errors.push(`Invalid sets for ${resolved.name}. Use 1–12.`);
      current = null;
      return;
    }

    exercises.push({
      exerciseId: resolved.id,
      name: resolved.name,
      sets,
      reps,
      restSeconds,
      groupId: current.groupId,
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

    if (row.key === "protocol_mode") {
      flushCurrent();
      const mode = row.value.toLowerCase() as IntervalMode;
      if (!VALID_MODES.includes(mode)) {
        errors.push(`Invalid protocol_mode "${row.value}".`);
      } else {
        protocolDraft.mode = mode;
      }
      continue;
    }

    if (row.key === "work_seconds") {
      protocolDraft.workSeconds = Number(row.value);
      continue;
    }
    if (row.key === "rest_seconds" && !current) {
      protocolDraft.restSeconds = Number(row.value);
      continue;
    }
    if (row.key === "rounds") {
      protocolDraft.rounds = Number(row.value);
      continue;
    }
    if (row.key === "between_exercise_rest_seconds") {
      protocolDraft.betweenExerciseRestSeconds = Number(row.value);
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
    } else if (row.key === "group_id") {
      const group = row.value.trim().toUpperCase();
      current.groupId = group || undefined;
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

  let intervalProtocol: IntervalProtocol | undefined;
  if (protocolDraft.mode) {
    const candidate = {
      mode: protocolDraft.mode,
      workSeconds: protocolDraft.workSeconds ?? 30,
      restSeconds: protocolDraft.restSeconds ?? 45,
      rounds: protocolDraft.rounds ?? 4,
      betweenExerciseRestSeconds: protocolDraft.betweenExerciseRestSeconds,
    };
    if (!isIntervalProtocol(candidate)) {
      errors.push("Invalid interval protocol fields.");
    } else {
      intervalProtocol = candidate;
    }
  }

  if (errors.length > 0 && !intervalProtocol && protocolDraft.mode) {
    return { workout: null, errors, warnings };
  }

  return {
    workout: {
      name: workoutName,
      exercises,
      intervalProtocol,
    },
    errors,
    warnings,
  };
}

export function buildForgeRepWorkoutTemplateCsv(input: {
  name: string;
  exercises: ParsedWorkoutExercise[];
  intervalProtocol?: IntervalProtocol;
}): string {
  const version = input.intervalProtocol ? HEADER_MARKER_V2 : HEADER_MARKER_V1;
  const lines = [version, `workout_name,${input.name}`];

  if (input.intervalProtocol) {
    lines.push(`protocol_mode,${input.intervalProtocol.mode}`);
    lines.push(`work_seconds,${input.intervalProtocol.workSeconds}`);
    lines.push(`rest_seconds,${input.intervalProtocol.restSeconds}`);
    lines.push(`rounds,${input.intervalProtocol.rounds}`);
    if (input.intervalProtocol.betweenExerciseRestSeconds != null) {
      lines.push(
        `between_exercise_rest_seconds,${input.intervalProtocol.betweenExerciseRestSeconds}`
      );
    }
  }

  lines.push("");

  for (const exercise of input.exercises) {
    lines.push(`exercise_id,${exercise.exerciseId}`);
    lines.push(`exercise_name,${exercise.name}`);
    lines.push(`sets,${exercise.sets}`);
    lines.push(`reps,${exercise.reps}`);
    lines.push(`rest_seconds,${exercise.restSeconds}`);
    if (exercise.groupId) {
      lines.push(`group_id,${exercise.groupId}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
