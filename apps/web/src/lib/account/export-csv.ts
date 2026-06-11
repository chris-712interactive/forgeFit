import type { AccountExportBundle } from "./export";

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

export function buildAccountExportCsv(bundle: AccountExportBundle): string {
  const sections: string[] = [];

  sections.push("# ForgeFit account export (CSV)");
  sections.push(`# Exported at: ${bundle.exportedAt}`);
  sections.push("");

  sections.push("# Profile");
  if (bundle.profile) {
    sections.push(
      rowsToCsv(
        ["id", "email", "primary_goal", "experience_level", "subscription_tier"],
        [
          {
            id: bundle.profile.id,
            email: bundle.profile.email,
            primary_goal: bundle.profile.primary_goal,
            experience_level: bundle.profile.experience_level,
            subscription_tier: bundle.profile.subscription_tier,
          },
        ]
      )
    );
  }
  sections.push("");

  sections.push("# Workout sets");
  const setRows = bundle.workoutSessions.flatMap((session) =>
    session.sets.map((set) => ({
      session_id: session.id,
      session_name: session.session_name,
      started_at: session.started_at,
      exercise_name: set.exercise_name,
      set_number: set.set_number,
      reps: set.reps,
      weight_kg: set.weight_kg,
      rir: set.rir,
      effort: set.effort,
    }))
  );
  sections.push(
    rowsToCsv(
      [
        "session_id",
        "session_name",
        "started_at",
        "exercise_name",
        "set_number",
        "reps",
        "weight_kg",
        "rir",
        "effort",
      ],
      setRows
    )
  );
  sections.push("");

  sections.push("# Nutrition logs");
  sections.push(
    rowsToCsv(
      [
        "logged_date",
        "meal_type",
        "food_name",
        "quantity",
        "calories",
        "protein_g",
        "fat_g",
        "carbs_g",
      ],
      bundle.nutritionLogs.map((row) => ({
        logged_date: row.logged_date,
        meal_type: row.meal_type,
        food_name: row.food_name,
        quantity: row.quantity,
        calories: row.calories,
        protein_g: row.protein_g,
        fat_g: row.fat_g,
        carbs_g: row.carbs_g,
      }))
    )
  );
  sections.push("");

  sections.push("# Body measurements");
  sections.push(
    rowsToCsv(
      ["measured_date", "weight_kg", "waist_cm", "body_fat_pct", "notes"],
      bundle.bodyMeasurements.map((row) => ({
        measured_date: row.measured_date,
        weight_kg: row.weight_kg,
        waist_cm: row.waist_cm,
        body_fat_pct: row.body_fat_pct,
        notes: row.notes,
      }))
    )
  );

  return sections.join("\n");
}
