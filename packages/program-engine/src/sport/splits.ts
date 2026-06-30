import { getSportById } from "@forgefit/evidence-kb";
import type { MovementPattern } from "@forgefit/exercise-db";
import type { SessionTemplate } from "../splits";

function session(
  name: string,
  patterns: MovementPattern[],
  includeCardio?: boolean
): SessionTemplate {
  return { name, patterns, includeCardio };
}

/** Extra patterns appended when a position modifier applies. */
export const POSITION_PATTERN_BOOSTS: Record<string, MovementPattern[]> = {
  lateral_power_endurance: ["lunge", "core"],
  balanced_athletic: ["lunge"],
  lower_power_post_strength: ["squat", "hinge"],
  reactive_power: ["vertical_push", "core"],
  endurance_strength: ["lunge", "core"],
  endurance_power: ["lunge", "hinge"],
  sprint_power: ["lunge", "squat"],
  speed_agility: ["lunge", "horizontal_pull"],
  max_strength_mass: ["squat", "hinge"],
  balanced_power: ["squat", "horizontal_push"],
  upper_endurance_agility: ["horizontal_pull", "core"],
  vertical_power: ["squat", "lunge"],
  vertical_block_power: ["squat", "vertical_push"],
  lateral_endurance: ["lunge", "core"],
  overhead_arm_care: ["horizontal_pull", "core"],
  softball_pitcher_arm_care: ["horizontal_pull", "core"],
  rotational_power: ["hinge", "horizontal_push"],
  strength_agility: ["hinge", "lunge"],
  elastic_power: ["squat", "lunge"],
  max_strength_power: ["squat", "hinge"],
  stunting_base_strength: ["horizontal_push", "horizontal_pull", "core"],
  flyer_relative_power: ["vertical_pull", "lunge", "core"],
  tumbling_landing_power: ["squat", "lunge", "core"],
};

export function applyPositionModifier(
  templates: SessionTemplate[],
  modifier?: string | null
): SessionTemplate[] {
  if (!modifier) return templates;

  const boosts = POSITION_PATTERN_BOOSTS[modifier];
  if (!boosts?.length) return templates;

  return templates.map((template) => {
    const patterns = [...template.patterns];
    for (const pattern of boosts) {
      if (!patterns.includes(pattern)) {
        patterns.push(pattern);
      }
    }
    return { ...template, patterns };
  });
}

export function modifierForPosition(
  sportId: string,
  positionId?: string | null
): string | undefined {
  if (!positionId) return undefined;
  const sport = getSportById(sportId);
  return sport?.positions.find((position) => position.id === positionId)?.modifier;
}

const BASKETBALL: SessionTemplate[] = [
  session("Lower Power", ["squat", "lunge", "core"]),
  session("Upper Strength", ["horizontal_push", "horizontal_pull", "vertical_push"]),
  session("Athletic", ["hinge", "lunge", "carry"]),
  session("Maintenance", ["squat", "core", "vertical_pull"]),
];

const SOCCER: SessionTemplate[] = [
  session("Single-Leg Strength", ["lunge", "hinge", "core"]),
  session("Upper & Core", ["horizontal_pull", "vertical_push", "core"]),
  session("Power & Agility", ["squat", "lunge", "horizontal_push"]),
  session("Resilience", ["hinge", "lunge", "core"]),
];

const FOOTBALL: SessionTemplate[] = [
  session("Lower Power", ["squat", "hinge", "lunge"]),
  session("Upper Push/Pull", ["horizontal_push", "horizontal_pull", "core"]),
  session("Explosive", ["squat", "lunge", "carry"]),
  session("Strength", ["hinge", "horizontal_push", "core"]),
];

const VOLLEYBALL: SessionTemplate[] = [
  session("Jump & Land", ["squat", "lunge", "core"]),
  session("Upper Prep", ["horizontal_push", "horizontal_pull", "vertical_push"]),
  session("Athletic", ["hinge", "lunge", "core"]),
  session("Maintenance", ["squat", "vertical_pull", "core"]),
];

const BASEBALL: SessionTemplate[] = [
  session("Lower & Rotational", ["hinge", "lunge", "core"]),
  session("Upper Strength", ["horizontal_push", "horizontal_pull"]),
  session("Power", ["squat", "horizontal_push", "core"]),
  session("Arm Care", ["horizontal_pull", "core", "vertical_pull"]),
];

const SOFTBALL: SessionTemplate[] = [
  session("Lower & Rotational", ["hinge", "lunge", "core"]),
  session("Upper Strength", ["horizontal_push", "horizontal_pull"]),
  session("Power", ["squat", "lunge", "core"]),
  session("Arm Care", ["horizontal_pull", "core", "vertical_pull"]),
];

const CHEER: SessionTemplate[] = [
  session("Jump & Land", ["squat", "lunge", "core"]),
  session("Stunt Prep", ["horizontal_push", "horizontal_pull", "vertical_push"]),
  session("Core Stability", ["core", "vertical_pull", "carry"]),
  session("Power Maintenance", ["squat", "hinge", "lunge"]),
];

const GENERAL: SessionTemplate[] = [
  session("Athletic A", ["squat", "horizontal_push", "horizontal_pull"]),
  session("Athletic B", ["hinge", "vertical_push", "vertical_pull"]),
  session("Athletic C", ["lunge", "carry", "core"]),
  session("Athletic D", ["squat", "hinge", "core"]),
];

const SPORT_TEMPLATES: Record<string, SessionTemplate[]> = {
  basketball: BASKETBALL,
  soccer: SOCCER,
  football: FOOTBALL,
  volleyball: VOLLEYBALL,
  baseball: BASEBALL,
  softball: SOFTBALL,
  competitive_cheer: CHEER,
  general_athleticism: GENERAL,
};

export function baseTemplatesForSport(sportId: string): SessionTemplate[] {
  return SPORT_TEMPLATES[sportId] ?? GENERAL;
}

export function getSportWeeklySplit(
  sportId: string,
  positionId: string | null | undefined,
  sessionsPerWeek: number
): SessionTemplate[] {
  const n = Math.min(Math.max(sessionsPerWeek, 2), 6);
  const modifier = modifierForPosition(sportId, positionId);
  const templates = applyPositionModifier(
    baseTemplatesForSport(sportId),
    modifier
  );
  return templates.slice(0, n);
}
