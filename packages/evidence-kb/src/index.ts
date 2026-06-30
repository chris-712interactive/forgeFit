import { EXTRA_RULES } from "./rules-extra";
import type { EvidenceRule } from "./types";

export type { EvidenceRule, Citation, Confidence } from "./types";
export {
  matchRules,
  getRecommendationValue,
  type RuleContext,
} from "./match";

/** Evidence KB version — bump when rules change materially */
export const EVIDENCE_KB_VERSION = "0.3.2";

const SEED_RULES: EvidenceRule[] = [
  {
    id: "fat_loss_rate",
    domain: "nutrition",
    applies_to: ["goal:fat_loss"],
    recommendation: {
      weekly_bodyweight_loss_pct: { min: 0.5, optimal: 0.75, max: 1.0 },
    },
    citations: [
      {
        url: "https://www.mdpi.com/2072-6643/13/9/3255",
        summary: "Athlete fat loss phase: 0.5–1.0% BW/week maximizes FFM retention",
      },
    ],
    confidence: "high",
  },
  {
    id: "protein_deficit_general",
    domain: "nutrition",
    applies_to: ["goal:fat_loss", "goal:recomposition"],
    recommendation: {
      protein_g_per_kg: { min: 1.6, optimal: 2.0, max: 2.4 },
      meal_frequency: { min: 3, max: 6 },
    },
    citations: [
      {
        url: "https://examine.com/guides/protein-intake/",
        summary: "1.6–2.4 g/kg/d during deficit preserves lean mass",
      },
    ],
    confidence: "high",
  },
  {
    id: "protein_deficit_overweight",
    domain: "nutrition",
    applies_to: ["goal:fat_loss", "bmi_gte:25"],
    recommendation: {
      protein_g_per_kg: { min: 1.3, optimal: 1.6, max: 2.0 },
    },
    citations: [
      {
        doi: "10.1136/bmjsem-2024-002363",
        summary: "RT during diet preserves fat-free mass in overweight adults",
      },
    ],
    confidence: "high",
  },
  {
    id: "protein_athlete_cut",
    domain: "nutrition",
    applies_to: ["experience:advanced", "goal:bodybuilding"],
    recommendation: {
      protein_g_per_kg: { min: 2.2, optimal: 2.5, max: 3.0 },
      protein_per_meal_g_per_kg: { min: 0.4, max: 0.55 },
    },
    citations: [
      {
        url: "https://www.mdpi.com/2072-6643/13/9/3255",
        summary: "Resistance-trained athletes: 2.2–3.0 g/kg/day during cut",
      },
    ],
    confidence: "high",
  },
  {
    id: "resistance_training_during_deficit",
    domain: "training",
    applies_to: ["goal:fat_loss", "goal:recomposition"],
    recommendation: {
      resistance_sessions_per_week: { min: 2, optimal: 3, max: 4 },
      priority: "preserve_ffm",
    },
    citations: [
      {
        doi: "10.1136/bmjsem-2024-002363",
        summary: "RT during weight loss preserves FFM (SMD 0.40) and increases fat loss",
      },
    ],
    confidence: "high",
  },
  {
    id: "hypertrophy_weekly_volume",
    domain: "training",
    applies_to: ["goal:bodybuilding", "goal:recomposition"],
    recommendation: {
      hard_sets_per_muscle_per_week: { min: 10, optimal: 16, max: 20 },
      note: "Diminishing returns above ~20 sets/muscle/week",
    },
    citations: [
      {
        url: "https://elementssystem.com/wp-content/uploads/2018/08/Schoenfeld-volumen-review.pdf",
        summary: "Graded dose-response between weekly volume and hypertrophy",
      },
      {
        url: "https://sportrxiv.org/index.php/server/preprint/view/460",
        summary: "Pelland 2024 meta-regression: volume drives hypertrophy with diminishing returns",
      },
    ],
    confidence: "high",
  },
  {
    id: "strength_training_frequency",
    domain: "training",
    applies_to: ["goal:general_strength", "goal:powerlifting"],
    recommendation: {
      frequency_per_lift_per_week: { min: 2, optimal: 3, max: 4 },
      note: "Higher frequency benefits strength when volume is equated",
    },
    citations: [
      {
        url: "https://sportrxiv.org/index.php/server/preprint/view/460",
        summary: "Frequency dose-response stronger for strength than hypertrophy",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "creatine_supplementation",
    domain: "supplements",
    applies_to: ["goal:bodybuilding", "goal:general_strength", "goal:powerlifting"],
    recommendation: {
      creatine_monohydrate_g_per_day: { min: 3, optimal: 5, max: 5 },
    },
    citations: [
      {
        url: "https://www.mdpi.com/2072-6643/13/9/3255",
        summary: "Creatine 3–5 g/day ergogenic for resistance training",
      },
    ],
    confidence: "high",
  },
  {
    id: "recovery_sleep",
    domain: "recovery",
    applies_to: ["*"],
    recommendation: {
      sleep_hours: { min: 7, optimal: 8, max: 9 },
    },
    citations: [
      {
        url: "https://www.acsm.org",
        summary: "ACSM guidelines: adequate sleep supports recovery and adaptation",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "deload_intermediate",
    domain: "recovery",
    applies_to: ["experience:intermediate", "experience:advanced"],
    recommendation: {
      deload_every_weeks: { min: 4, optimal: 6, max: 8 },
      volume_reduction_pct: 40,
    },
    citations: [
      {
        url: "https://www.acsm.org",
        summary: "Periodic deloads manage fatigue accumulation in trained individuals",
      },
    ],
    confidence: "moderate",
  },
];

export const ALL_RULES: EvidenceRule[] = [...SEED_RULES, ...EXTRA_RULES];

export function getRules(): EvidenceRule[] {
  return ALL_RULES;
}

export function getRuleById(id: string): EvidenceRule | undefined {
  return ALL_RULES.find((r) => r.id === id);
}

export function getRulesByIds(ids: string[]): EvidenceRule[] {
  const seen = new Set<string>();
  return ids
    .map((id) => getRuleById(id))
    .filter((rule): rule is EvidenceRule => {
      if (!rule || seen.has(rule.id)) return false;
      seen.add(rule.id);
      return true;
    });
}

export {
  getSportById,
  getSportCategories,
  getSeasonPhases,
  getSportsByCategory,
  isValidSeasonPhase,
  isValidSportId,
  isValidSportPositionId,
  sportRequiresPosition,
  SPORTS_CATALOG,
  SPORTS_CATALOG_VERSION,
} from "./sports-catalog";
export type {
  SportCategory,
  SportDefinition,
  SportPosition,
  SportSeasonPhase,
  SeasonPhaseDefinition,
  SportsCatalog,
} from "./sports-catalog";
