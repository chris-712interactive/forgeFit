import type { MovementPattern } from "@forgefit/exercise-db";
import type { FitnessGoal } from "./types";

export interface SessionTemplate {
  name: string;
  patterns: MovementPattern[];
  includeCardio?: boolean;
}

function session(
  name: string,
  patterns: MovementPattern[],
  includeCardio?: boolean
): SessionTemplate {
  return { name, patterns, includeCardio };
}

export function getWeeklySplit(
  goal: FitnessGoal,
  sessionsPerWeek: number
): SessionTemplate[] {
  const n = Math.min(Math.max(sessionsPerWeek, 2), 6);

  if (goal === "powerlifting") {
    const templates: SessionTemplate[] = [
      session("Squat Focus", ["squat", "horizontal_pull", "core"]),
      session("Bench Focus", ["horizontal_push", "vertical_pull", "isolation_arms"]),
      session("Deadlift Focus", ["hinge", "vertical_push", "core"]),
      session("Accessories", ["lunge", "horizontal_pull", "isolation_legs"]),
    ];
    return templates.slice(0, n);
  }

  if (goal === "bodybuilding") {
    if (n <= 3) {
      return [
        session("Push", ["horizontal_push", "vertical_push", "isolation_arms"]),
        session("Pull", ["horizontal_pull", "vertical_pull", "isolation_arms"]),
        session("Legs", ["squat", "hinge", "isolation_legs", "core"]),
      ].slice(0, n);
    }
    if (n === 4) {
      return [
        session("Upper A", ["horizontal_push", "horizontal_pull", "vertical_push"]),
        session("Lower A", ["squat", "hinge", "isolation_legs"]),
        session("Upper B", ["vertical_pull", "horizontal_push", "isolation_arms"]),
        session("Lower B", ["lunge", "hinge", "core"]),
      ];
    }
    return [
      session("Push", ["horizontal_push", "vertical_push", "isolation_arms"]),
      session("Pull", ["horizontal_pull", "vertical_pull"]),
      session("Legs", ["squat", "hinge", "isolation_legs"]),
      session("Upper", ["horizontal_push", "horizontal_pull", "vertical_pull"]),
      session("Lower", ["squat", "hinge", "core"]),
      session("Arms & Core", ["horizontal_pull", "isolation_arms", "core"]),
    ].slice(0, n);
  }

  if (goal === "fat_loss") {
    const base: SessionTemplate[] = [
      session("Full Body A", ["squat", "horizontal_push", "horizontal_pull", "core"], true),
      session("Full Body B", ["hinge", "vertical_push", "vertical_pull", "core"], true),
      session("Full Body C", ["lunge", "horizontal_push", "horizontal_pull"], true),
      session("Metabolic Circuit", ["squat", "horizontal_push", "hinge", "core"], true),
    ];
    return base.slice(0, n);
  }

  if (goal === "sport_performance") {
    const athletic: SessionTemplate[] = [
      session("Athletic A", ["squat", "horizontal_push", "horizontal_pull"]),
      session("Athletic B", ["hinge", "vertical_push", "vertical_pull"]),
      session("Athletic C", ["lunge", "carry", "core"]),
      session("Athletic D", ["squat", "hinge", "core"]),
    ];
    return athletic.slice(0, n);
  }

  if (goal === "recomposition") {
    if (n <= 3) {
      return [
        session("Full Body A", ["squat", "horizontal_push", "horizontal_pull"]),
        session("Full Body B", ["hinge", "vertical_push", "vertical_pull"]),
        session("Full Body C", ["lunge", "horizontal_push", "core"]),
      ].slice(0, n);
    }
    return [
      session("Upper", ["horizontal_push", "horizontal_pull", "vertical_push"]),
      session("Lower", ["squat", "hinge", "isolation_legs"]),
      session("Upper", ["vertical_pull", "horizontal_push", "isolation_arms"]),
      session("Lower", ["lunge", "hinge", "carry"]),
    ].slice(0, n);
  }

  // general_strength
  const strength: SessionTemplate[] = [
    session("Full Body A", ["squat", "horizontal_push", "horizontal_pull"]),
    session("Full Body B", ["hinge", "vertical_push", "vertical_pull"]),
    session("Full Body C", ["squat", "hinge", "core"]),
    session("Full Body D", ["lunge", "horizontal_push", "carry"]),
  ];
  return strength.slice(0, n);
}
