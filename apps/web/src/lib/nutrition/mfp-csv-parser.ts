import type { MealType } from "@/lib/nutrition/meal-types";
import { minNutritionLogDate } from "@/lib/nutrition/date-param";

export interface MfpImportRow {
  loggedDate: string;
  mealType: MealType | null;
  foodName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface MfpCsvParseResult {
  rows: MfpImportRow[];
  skipped: number;
  errors: string[];
}

const MAX_IMPORT_ROWS = 500;

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function findColumnIndex(headers: string[], candidates: string[]): number {
  const normalized = headers.map(normalizeHeader);
  for (const candidate of candidates) {
    const index = normalized.indexOf(candidate);
    if (index >= 0) return index;
  }
  return -1;
}

function parseMfpDate(value: string): string | null {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const mdy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    const month = mdy[1].padStart(2, "0");
    const day = mdy[2].padStart(2, "0");
    return `${mdy[3]}-${month}-${day}`;
  }

  return null;
}

function mapMfpMeal(value: string): MealType | null {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("breakfast")) return "breakfast";
  if (normalized.includes("lunch")) return "lunch";
  if (normalized.includes("dinner")) return "dinner";
  if (normalized.includes("snack")) return "snack";
  return null;
}

function parseNumber(value: string): number {
  const cleaned = value.replace(/,/g, "").trim();
  if (!cleaned) return 0;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseMfpDiaryCsv(
  csvText: string,
  options?: { todayIso?: string }
): MfpCsvParseResult {
  const todayIso =
    options?.todayIso ?? new Date().toISOString().slice(0, 10);
  const minDate = minNutritionLogDate(todayIso);

  const lines = csvText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { rows: [], skipped: 0, errors: ["CSV file looks empty."] };
  }

  const headers = parseCsvLine(lines[0]);
  const dateIndex = findColumnIndex(headers, ["date"]);
  const mealIndex = findColumnIndex(headers, ["meal"]);
  const foodIndex = findColumnIndex(headers, [
    "food",
    "food name",
    "foodname",
  ]);
  const caloriesIndex = findColumnIndex(headers, ["calories"]);
  const proteinIndex = findColumnIndex(headers, [
    "protein (g)",
    "protein(g)",
    "protein",
  ]);
  const carbsIndex = findColumnIndex(headers, [
    "carbohydrates (g)",
    "carbs (g)",
    "carbohydrates",
    "carbs",
  ]);
  const fatIndex = findColumnIndex(headers, ["fat (g)", "fat(g)", "fat"]);

  const errors: string[] = [];
  if (dateIndex < 0) errors.push("Missing Date column.");
  if (foodIndex < 0) errors.push("Missing Food column.");
  if (caloriesIndex < 0 && proteinIndex < 0) {
    errors.push("Missing Calories or Protein column.");
  }
  if (errors.length > 0) {
    return { rows: [], skipped: 0, errors };
  }

  const rows: MfpImportRow[] = [];
  let skipped = 0;

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    if (rows.length >= MAX_IMPORT_ROWS) {
      errors.push(`Import capped at ${MAX_IMPORT_ROWS} entries per upload.`);
      break;
    }

    const cells = parseCsvLine(lines[lineIndex]);
    const foodName = cells[foodIndex]?.trim();
    if (!foodName) {
      skipped += 1;
      continue;
    }

    const loggedDate = parseMfpDate(cells[dateIndex] ?? "");
    if (!loggedDate) {
      skipped += 1;
      continue;
    }
    if (loggedDate > todayIso || loggedDate < minDate) {
      skipped += 1;
      continue;
    }

    const calories = parseNumber(cells[caloriesIndex] ?? "0");
    const proteinG = parseNumber(cells[proteinIndex] ?? "0");
    const carbsG = parseNumber(cells[carbsIndex] ?? "0");
    const fatG = parseNumber(cells[fatIndex] ?? "0");

    if (calories <= 0 && proteinG <= 0 && carbsG <= 0 && fatG <= 0) {
      skipped += 1;
      continue;
    }

    rows.push({
      loggedDate,
      mealType: mealIndex >= 0 ? mapMfpMeal(cells[mealIndex] ?? "") : null,
      foodName,
      calories,
      proteinG,
      carbsG,
      fatG,
    });
  }

  if (rows.length === 0 && errors.length === 0) {
    errors.push("No valid diary rows found in that file.");
  }

  return { rows, skipped, errors };
}
