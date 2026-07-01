import type { FitnessGoal } from "@/lib/types/profile";
import type { WeeklyWorkStats } from "./types";

interface EncouragementInput {
  goal: FitnessGoal | null;
  displayName: string | null;
  weekly: WeeklyWorkStats;
  proteinLoggedG: number;
  proteinTargetG: number | null;
  whyStarted: string | null;
}

const GOAL_MESSAGES: Record<FitnessGoal, string[]> = {
  fat_loss: [
    "Small consistent wins beat perfect weeks. You're building the habit.",
    "Every logged meal and finished set moves the needle. Stay steady.",
    "Discipline today is the body you want tomorrow. Keep showing up.",
  ],
  bodybuilding: [
    "Volume and nutrition both count — you're tracking what matters.",
    "Progress is built set by set. This week is another layer.",
    "Train hard, recover smart, fuel the work. You're on it.",
  ],
  powerlifting: [
    "Heavy work rewards patience. Stack good sessions this week.",
    "Strength is earned in the reps you actually log. Keep pushing.",
    "Show up, execute, recover. That's the whole game.",
  ],
  general_strength: [
    "Consistency beats intensity spikes. You're putting in the work.",
    "Strong habits today make strong weeks. Nice momentum.",
    "One session at a time — you're building real capacity.",
  ],
  recomposition: [
    "Training plus nutrition alignment is your edge. Stay accountable.",
    "Recomp is a marathon of good days. You're stacking them.",
    "Lift, fuel, recover — you're covering the bases.",
  ],
  sport_performance: [
    "Sport fitness is built in the sessions you finish. Stay consistent.",
    "Strong in the gym, sharp on the field — keep stacking good weeks.",
    "Fuel the work, recover smart, show up for practice and training.",
  ],
  functional_conditioning: [
    "Strength and conditioning in one plan — move with intent each session.",
    "Every round builds work capacity. Stay sharp, stay moving.",
    "Compound effort, full-body payoff — stack good weeks.",
  ],
};

function hashPick<T>(items: T[], seed: number): T {
  return items[Math.abs(seed) % items.length]!;
}

export function pickEncouragement(input: EncouragementInput): string {
  const name = input.displayName?.trim();
  const prefix = name ? `${name.split(/\s+/)[0]}, ` : "";

  if (input.weekly.workoutsCompleted >= input.weekly.workoutsPlanned && input.weekly.workoutsPlanned > 0) {
    return `${prefix}you hit every planned session this week. That's forge-level consistency.`;
  }

  const proteinPct =
    input.proteinTargetG && input.proteinTargetG > 0
      ? input.proteinLoggedG / input.proteinTargetG
      : 0;

  if (proteinPct >= 1) {
    return `${prefix}protein target crushed today — your muscles noticed.`;
  }

  if (proteinPct >= 0.5 && proteinPct < 1) {
    return `${prefix}you're halfway to today's protein goal. Finish strong at lunch or dinner.`;
  }

  if (input.weekly.workoutsCompleted === 0 && input.weekly.workoutsPlanned > 0) {
    return `${prefix}new week, clean slate. One workout today sets the tone.`;
  }

  if (input.whyStarted && input.weekly.workoutsCompleted > 0) {
    return `${prefix}remember why you started — you're already proving it this week.`;
  }

  const goal = input.goal ?? "general_strength";
  const messages = GOAL_MESSAGES[goal];
  const seed =
    input.weekly.workoutsCompleted * 7 +
    input.weekly.totalSets +
    Math.floor(proteinPct * 10);

  return prefix + hashPick(messages, seed);
}
