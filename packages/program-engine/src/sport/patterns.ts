import { getRecommendationValue, type EvidenceRule } from "@forgefit/evidence-kb";
import type { MovementPattern } from "@forgefit/exercise-db";

const VALID_PATTERNS = new Set<MovementPattern>([
  "squat",
  "hinge",
  "lunge",
  "horizontal_push",
  "horizontal_pull",
  "vertical_push",
  "vertical_pull",
  "carry",
  "core",
  "cardio",
]);

function parsePriorityPatterns(rules: EvidenceRule[]): MovementPattern[] {
  const patterns: MovementPattern[] = [];

  for (const rule of rules) {
    const raw = rule.recommendation.priority_patterns;
    if (!Array.isArray(raw)) continue;

    for (const entry of raw) {
      if (typeof entry !== "string") continue;
      if (!VALID_PATTERNS.has(entry as MovementPattern)) continue;
      const pattern = entry as MovementPattern;
      if (!patterns.includes(pattern)) {
        patterns.push(pattern);
      }
    }
  }

  return patterns;
}

/** Merge evidence priority patterns ahead of session template patterns. */
export function mergeSessionPatterns(
  templatePatterns: MovementPattern[],
  rules: EvidenceRule[]
): MovementPattern[] {
  const priority = parsePriorityPatterns(rules);
  if (priority.length === 0) return templatePatterns;

  const merged = [...priority];
  for (const pattern of templatePatterns) {
    if (!merged.includes(pattern)) {
      merged.push(pattern);
    }
  }
  return merged;
}

export function sportRepsRange(
  rules: EvidenceRule[],
  fallback: string
): string {
  return getRecommendationValue<string>(rules, "reps_range", "optimal") ?? fallback;
}

export function requiresNeuromuscularWarmup(rules: EvidenceRule[]): boolean {
  return (
    getRecommendationValue<number>(rules, "neuromuscular_warmup_minutes", "optimal") !=
    null
  );
}
