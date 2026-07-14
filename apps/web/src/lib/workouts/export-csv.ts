import { enrichSetWithEffort } from "@/lib/account/effort";
import type { WorkoutSessionRecord } from "./sessions";

function escapeCsv(value: unknown): string {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function rowsToCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsv(row[header])).join(","));
  }
  return lines.join("\n");
}

export function buildCompletedWorkoutsCsv(
  sessions: WorkoutSessionRecord[],
  exportedAt: string
): string {
  const sections: string[] = [
    "# forgerep-workout-log v1",
    `# Exported at: ${exportedAt}`,
    "",
  ];

  for (const session of sessions) {
    if (session.status !== "completed") continue;

    sections.push(`session_id,${session.clientId}`);
    sections.push(`session_name,${session.sessionName}`);
    sections.push(`session_source,${session.sessionSource ?? "program"}`);
    sections.push(`started_at,${session.startedAt}`);
    sections.push(`completed_at,${session.completedAt ?? ""}`);
    sections.push("");

    const setRows = session.sets.map((set) => {
      const effort = enrichSetWithEffort({ rir: set.rir }).effort;
      return {
        exercise_name: set.exerciseName,
        set_number: set.setNumber,
        reps: set.reps ?? "",
        weight_kg: set.weightKg ?? "",
        duration_ms: set.durationMs ?? "",
        rir: set.rir ?? "",
        effort: effort ?? "",
        completed: set.completed,
      };
    });

    sections.push(
      rowsToCsv(
        [
          "exercise_name",
          "set_number",
          "reps",
          "weight_kg",
          "duration_ms",
          "rir",
          "effort",
          "completed",
        ],
        setRows
      )
    );
    sections.push("");
  }

  return sections.join("\n");
}
