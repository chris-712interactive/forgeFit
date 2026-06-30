import type { EvidenceRule } from "./types";

export type AgeBand =
  | "youth_13_15"
  | "teen_16_17"
  | "young_adult_18_22"
  | "adult_23_plus";

export interface RuleContext {
  goal: string;
  experience: string;
  weightKg: number;
  heightCm: number;
  age?: number;
  ageBand?: AgeBand;
  sportId?: string;
  sportPositionId?: string;
  seasonPhase?: string;
  secondaryGoal?: string;
  recoveryEquipment?: string[];
}

function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

function resolveAgeBand(age: number): AgeBand {
  if (age < 16) return "youth_13_15";
  if (age < 18) return "teen_16_17";
  if (age <= 22) return "young_adult_18_22";
  return "adult_23_plus";
}

function resolveAgeBandFromContext(ctx: RuleContext): AgeBand | undefined {
  if (ctx.ageBand) return ctx.ageBand;
  if (ctx.age != null) return resolveAgeBand(ctx.age);
  return undefined;
}

function tagMatches(ruleTag: string, ctx: RuleContext): boolean {
  if (ruleTag === "*") return true;

  const [key, value] = ruleTag.split(":");
  switch (key) {
    case "goal":
      return ctx.goal === value;
    case "experience":
      return ctx.experience === value;
    case "bmi_gte":
      return bmi(ctx.weightKg, ctx.heightCm) >= Number(value);
    case "recovery":
      return (ctx.recoveryEquipment ?? []).includes(value);
    case "age_band":
      return resolveAgeBandFromContext(ctx) === value;
    case "sport":
      return ctx.sportId === value;
    case "season":
      return ctx.seasonPhase === value;
    case "secondary":
      return ctx.secondaryGoal === value;
    default:
      return false;
  }
}

/** Rule applies when every tag matches (AND logic). */
export function ruleApplies(rule: EvidenceRule, ctx: RuleContext): boolean {
  return rule.applies_to.every((tag) => tagMatches(tag, ctx));
}

export function matchRules(
  rules: EvidenceRule[],
  ctx: RuleContext
): EvidenceRule[] {
  return rules.filter((rule) => ruleApplies(rule, ctx));
}

export function getRecommendationValue<T = number>(
  rules: EvidenceRule[],
  key: string,
  field: "min" | "optimal" | "max" = "optimal"
): T | undefined {
  for (const rule of rules) {
    const rec = rule.recommendation[key];
    if (rec && typeof rec === "object" && field in (rec as object)) {
      return (rec as Record<string, T>)[field];
    }
    if (rec !== undefined && typeof rec !== "object") {
      return rec as T;
    }
  }
  return undefined;
}
