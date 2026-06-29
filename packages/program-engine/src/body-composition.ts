import type { FatLossPace, RecompPriority } from "./types";

export const FAT_LOSS_PACE_DEFICIT_FIELD: Record<
  FatLossPace,
  "min" | "optimal" | "max"
> = {
  steady: "min",
  moderate: "optimal",
  aggressive: "max",
};

/** Base daily deficit before training eat-back adjustments (kcal). */
export const RECOMP_BASE_DEFICIT_KCAL: Record<RecompPriority, number> = {
  muscle: 100,
  balanced: 150,
  lean_out: 225,
};

export const FAT_LOSS_PACE_WEEKLY_PCT: Record<FatLossPace, number> = {
  steady: -0.5,
  moderate: -0.75,
  aggressive: -1.0,
};

export const RECOMP_PRIORITY_WEEKLY_PCT: Record<RecompPriority, number> = {
  muscle: -0.25,
  balanced: -0.35,
  lean_out: -0.5,
};

export function resolveFatLossPace(pace?: FatLossPace): FatLossPace {
  return pace ?? "moderate";
}

export function resolveRecompPriority(priority?: RecompPriority): RecompPriority {
  return priority ?? "balanced";
}

export function fatLossPaceLabel(pace: FatLossPace): string {
  switch (pace) {
    case "steady":
      return "Steady";
    case "moderate":
      return "Moderate";
    case "aggressive":
      return "Aggressive";
  }
}

export function recompPriorityLabel(priority: RecompPriority): string {
  switch (priority) {
    case "muscle":
      return "Build muscle";
    case "balanced":
      return "Balanced";
    case "lean_out":
      return "Lean out faster";
  }
}

export function describeFatLossPace(pace: FatLossPace): string {
  switch (pace) {
    case "steady":
      return "~½ lb/week — best for keeping muscle and energy for training.";
    case "moderate":
      return "~¾–1 lb/week — recommended balance of progress and recovery.";
    case "aggressive":
      return "~1+ lb/week — faster cut; best when you have more weight to lose.";
  }
}

export function describeRecompPriority(priority: RecompPriority): string {
  switch (priority) {
    case "muscle":
      return "Smaller deficit — prioritize strength and hypertrophy while trimming fat slowly.";
    case "balanced":
      return "Moderate deficit — trade fat loss and muscle gain evenly.";
    case "lean_out":
      return "Larger deficit — still below a full cut, but lean out faster.";
  }
}

export function describeEffectiveDeficit(
  effectiveDeficitKcal: number,
  goal: "fat_loss" | "recomposition"
): string {
  const weeklyKg = (effectiveDeficitKcal * 7) / 7700;
  const weeklyLb = weeklyKg * 2.205;
  const paceLine = `Effective deficit ~${effectiveDeficitKcal} kcal/day (~${weeklyLb.toFixed(1)} lb/week from diet).`;

  if (goal === "recomposition") {
    return `${paceLine} Recomp uses a smaller deficit than fat loss so you can build muscle while leaning out.`;
  }

  return `${paceLine} Training burn adds to total fat loss without eating back every workout calorie.`;
}
