import type { CoachingGoal, PrCelebrationInput, UnitSystem } from "./types";

const KG_PER_LB = 0.45359237;

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function formatWeightDisplay(kg: number, unit: UnitSystem): string {
  return unit === "imperial"
    ? `${round1(kg / KG_PER_LB)} lb`
    : `${round1(kg)} kg`;
}

const GOAL_LINES: Record<CoachingGoal, string[]> = {
  fat_loss: [
    "Stronger while leaning out — that's the move.",
    "New PR on a cut. Discipline showing up in the numbers.",
  ],
  bodybuilding: [
    "More weight, more growth signal. Stack it.",
    "Progressive overload locked in. Hypertrophy loves this.",
  ],
  powerlifting: [
    "The bar doesn't lie. New PR.",
    "Strength earned, not given. Respect.",
  ],
  general_strength: [
    "Capacity up. Keep building.",
    "You just raised your ceiling. Nice work.",
  ],
  recomposition: [
    "Getting stronger while recomping — that's the sweet spot.",
    "New best. Training and nutrition are aligning.",
  ],
};

function hashPick<T>(items: T[], seed: number): T {
  return items[Math.abs(seed) % items.length]!;
}

function namePrefix(displayName?: string | null): string {
  const first = displayName?.trim().split(/\s+/)[0];
  return first ? `${first}, ` : "";
}

export function pickPrCelebrationHeadline(input: PrCelebrationInput): string {
  return `New PR — ${input.exerciseLabel}`;
}

export function pickPrCelebrationBody(input: PrCelebrationInput): string {
  const prefix = namePrefix(input.displayName);
  const unit = input.unitSystem ?? "metric";
  const goalLine = hashPick(
    GOAL_LINES[input.goal],
    Math.round(input.e1rmKg * 10) + input.reps
  );
  return `${prefix}${input.reps} reps at ${formatWeightDisplay(input.weightKg, unit)}. ${goalLine}`;
}
