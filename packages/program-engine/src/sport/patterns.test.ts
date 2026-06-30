import assert from "node:assert/strict";
import test from "node:test";
import type { EvidenceRule } from "@forgefit/evidence-kb";
import {
  mergeSessionPatterns,
  requiresNeuromuscularWarmup,
  sportRepsRange,
} from "./patterns";

const basketballRule: EvidenceRule = {
  id: "basketball_power_development",
  domain: "training",
  applies_to: ["sport:basketball"],
  recommendation: {
    priority_patterns: ["squat", "lunge", "vertical_push"],
    reps_range: "5-8",
  },
  citations: [{ summary: "test" }],
  confidence: "moderate",
};

test("mergeSessionPatterns prepends evidence patterns without duplicates", () => {
  const merged = mergeSessionPatterns(
    ["horizontal_push", "squat"],
    [basketballRule]
  );
  assert.deepEqual(merged, [
    "squat",
    "lunge",
    "vertical_push",
    "horizontal_push",
  ]);
});

test("sportRepsRange reads reps_range from matched rules", () => {
  assert.equal(sportRepsRange([basketballRule], "5-8"), "5-8");
  assert.equal(sportRepsRange([], "5-8"), "5-8");
});

test("requiresNeuromuscularWarmup detects neuromuscular rules", () => {
  assert.equal(requiresNeuromuscularWarmup([basketballRule]), false);
  assert.equal(
    requiresNeuromuscularWarmup([
      {
        ...basketballRule,
        id: "acl_prevention_warmup",
        recommendation: {
          neuromuscular_warmup_minutes: { min: 5, optimal: 8, max: 10 },
        },
      },
    ]),
    true
  );
});
