import type { EvidenceRule } from "./types";

/**
 * Evidence backing for age gates and time budgets enforced in `age-policy.ts`.
 * Values must stay aligned with program-engine age policy helpers.
 */
export const YOUTH_POLICY_RULES: EvidenceRule[] = [
  {
    id: "youth_resistance_training_eligibility",
    domain: "training",
    applies_to: ["age_band:youth_13_15", "age_band:teen_16_17"],
    recommendation: {
      min_age_years: 13,
      note: "Progressive resistance training is appropriate for healthy adolescents with qualified supervision",
    },
    citations: [
      {
        doi: "10.1519/JSC.0b013e3181e3807b",
        summary:
          "NSCA position statement: youth RT improves strength, power, and motor skills when appropriately prescribed",
      },
      {
        doi: "10.1249/MSS.0000000000000101",
        summary:
          "AAP policy: supervised RT is safe for children and adolescents who follow age-appropriate progression",
      },
    ],
    confidence: "high",
  },
  {
    id: "youth_goal_gate_physique",
    domain: "training",
    applies_to: ["age_band:youth_13_15"],
    recommendation: {
      blocked_primary_goals: ["recomposition", "bodybuilding"],
      min_age_years: 15,
      note: "Physique-focused goals deferred until mid-adolescence; sport and general strength prioritized",
    },
    citations: [
      {
        doi: "10.1136/bjsports-2014-093502",
        summary:
          "RED-S consensus: adolescents need adequate energy for growth; aggressive physique cuts increase risk",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "youth_goal_gate_powerlifting",
    domain: "training",
    applies_to: ["age_band:youth_13_15", "age_band:teen_16_17"],
    recommendation: {
      blocked_primary_goals: ["powerlifting"],
      min_age_years: 16,
      note: "Maximal strength specialization deferred until neuromuscular maturity and technique base",
    },
    citations: [
      {
        doi: "10.1519/JSC.0b013e3181e3807b",
        summary:
          "Youth RT emphasizes technique and multi-joint patterns before maximal loading specialization",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "youth_fat_loss_pace_steady",
    domain: "nutrition",
    applies_to: ["age_band:youth_13_15", "goal:fat_loss"],
    recommendation: {
      allowed_fat_loss_paces: ["steady"],
      min_age_years: 13,
    },
    citations: [
      {
        doi: "10.1136/bjsports-2014-093502",
        summary:
          "Low energy availability impairs growth and sport performance in adolescent athletes",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "teen_fat_loss_pace_cap",
    domain: "nutrition",
    applies_to: ["age_band:teen_16_17", "goal:fat_loss"],
    recommendation: {
      allowed_fat_loss_paces: ["steady", "moderate"],
      blocked_fat_loss_paces: ["aggressive"],
      min_age_years: 18,
    },
    citations: [
      {
        doi: "10.1136/bjsports-2014-093502",
        summary:
          "Conservative fat-loss rates protect menstrual health, bone density, and training adaptation in teens",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "youth_experience_cap",
    domain: "training",
    applies_to: ["age_band:youth_13_15"],
    recommendation: {
      max_experience_level: "intermediate",
      note: "Advanced loading parameters capped for younger adolescents regardless of training history",
    },
    citations: [
      {
        doi: "10.1519/JSC.0b013e3181e3807b",
        summary:
          "Youth programs emphasize progressive overload with conservative volume before advanced periodization",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "youth_time_budget_13_15",
    domain: "training",
    applies_to: ["age_band:youth_13_15"],
    recommendation: {
      max_sessions_per_week: 4,
      max_minutes_per_session: 60,
    },
    citations: [
      {
        doi: "10.1519/JSC.0b013e3181e3807b",
        summary:
          "Youth S&C sessions stay brief with quality movement emphasis alongside sport practice load",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "teen_time_budget_16_17",
    domain: "training",
    applies_to: ["age_band:teen_16_17"],
    recommendation: {
      max_sessions_per_week: 5,
      max_minutes_per_session: 75,
    },
    citations: [
      {
        doi: "10.1519/JSC.0b013e3181e3807b",
        summary:
          "Older adolescents tolerate moderate gym frequency when total training stress is monitored",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "teen_adolescent_deficit_cap",
    domain: "nutrition",
    applies_to: ["age_band:teen_16_17", "secondary:fat_loss"],
    recommendation: {
      weekly_bodyweight_loss_pct: { min: 0.25, optimal: 0.5, max: 0.75 },
      daily_deficit_kcal: { min: 250, optimal: 350, max: 450 },
    },
    citations: [
      {
        doi: "10.1136/bjsports-2014-093502",
        summary:
          "Teen athletes in deficit need conservative rates to maintain energy availability and performance",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "youth_energy_availability_floor",
    domain: "nutrition",
    applies_to: ["age_band:youth_13_15", "age_band:teen_16_17", "goal:sport_performance"],
    recommendation: {
      relative_energy_availability_kcal_per_kg_ffm: { min: 30, optimal: 45, max: 45 },
      note: "Avoid chronic low energy availability during growth and competition phases",
    },
    citations: [
      {
        doi: "10.1136/bjsports-2014-093502",
        summary:
          "RED-S: relative energy availability below ~30 kcal/kg FFM/day risks health and performance in athletes",
      },
    ],
    confidence: "high",
  },
];
