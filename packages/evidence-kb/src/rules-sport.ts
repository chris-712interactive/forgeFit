import type { EvidenceRule } from "./types";

/** Youth LTAD, sport periodization, and hybrid-goal nutrition rules (Phase 9C). */
export const SPORT_RULES: EvidenceRule[] = [
  {
    id: "youth_ltad_volume_cap",
    domain: "training",
    applies_to: ["age_band:youth_13_15"],
    recommendation: {
      volume_multiplier: 0.55,
      max_sets_per_session: 10,
      max_sessions_per_week: 4,
    },
    citations: [
      {
        doi: "10.1519/JSC.0b013e3181e3807b",
        summary: "Youth resistance training: progressive overload with conservative volume for adolescents",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "teen_ltad_volume_cap",
    domain: "training",
    applies_to: ["age_band:teen_16_17"],
    recommendation: {
      volume_multiplier: 0.75,
      max_sessions_per_week: 5,
    },
    citations: [
      {
        doi: "10.1519/JSC.0b013e3181e3807b",
        summary: "Teen athletes tolerate moderate gym volume when sport practice load is accounted for",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "sport_in_season_volume",
    domain: "training",
    applies_to: ["goal:sport_performance", "season:in_season"],
    recommendation: {
      volume_multiplier: 0.65,
      max_gym_sessions_per_week: 3,
      note: "Maintain strength; avoid interfering with sport practice",
    },
    citations: [
      {
        url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3737872/",
        summary: "In-season strength maintenance with reduced gym volume preserves performance",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "sport_off_season_build",
    domain: "training",
    applies_to: ["goal:sport_performance", "season:off_season"],
    recommendation: {
      volume_multiplier: 1.0,
      priority: "strength_power_development",
    },
    citations: [
      {
        url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3737872/",
        summary: "Off-season blocks prioritize strength and power development for athletes",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "sport_general_prep",
    domain: "training",
    applies_to: ["goal:sport_performance", "season:general_prep"],
    recommendation: {
      volume_multiplier: 0.85,
      priority: "general_physical_preparedness",
    },
    citations: [
      {
        url: "https://www.nsca.com/education/articles/nsca-coach/periodization/",
        summary: "General prep phases rebuild work capacity before intensification",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "protein_youth_athlete",
    domain: "nutrition",
    applies_to: ["goal:sport_performance", "age_band:youth_13_15"],
    recommendation: {
      protein_g_per_kg: { min: 1.4, optimal: 1.6, max: 2.0 },
    },
    citations: [
      {
        url: "https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0177-8",
        summary: "Youth athletes: adequate protein supports growth and recovery during training",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "protein_teen_athlete",
    domain: "nutrition",
    applies_to: ["goal:sport_performance", "age_band:teen_16_17"],
    recommendation: {
      protein_g_per_kg: { min: 1.6, optimal: 1.8, max: 2.2 },
    },
    citations: [
      {
        url: "https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0177-8",
        summary: "Adolescent athletes benefit from 1.6–2.2 g/kg/day during intensive training",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "protein_sport_adult",
    domain: "nutrition",
    applies_to: ["goal:sport_performance"],
    recommendation: {
      protein_g_per_kg: { min: 1.6, optimal: 2.0, max: 2.2 },
    },
    citations: [
      {
        url: "https://examine.com/guides/protein-intake/",
        summary: "Athletes in training: 1.6–2.2 g/kg/day supports recovery and adaptation",
      },
    ],
    confidence: "high",
  },
  {
    id: "adolescent_deficit_cap",
    domain: "nutrition",
    applies_to: ["age_band:youth_13_15", "secondary:fat_loss"],
    recommendation: {
      weekly_bodyweight_loss_pct: { min: 0.25, optimal: 0.5, max: 0.5 },
      daily_deficit_kcal: { min: 200, optimal: 300, max: 350 },
    },
    citations: [
      {
        doi: "10.1136/bjsports-2014-093502",
        summary: "Conservative deficits in adolescents protect growth, performance, and recovery",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "sport_in_season_maintenance_calories",
    domain: "nutrition",
    applies_to: ["goal:sport_performance", "season:in_season"],
    recommendation: {
      calorie_adjustment_kcal: 0,
      note: "Maintenance during in-season; fuel practices and competition",
    },
    citations: [
      {
        url: "https://www.mdpi.com/2072-6643/13/9/3255",
        summary: "In-season athletes need adequate energy availability for performance",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "sport_off_season_surplus",
    domain: "nutrition",
    applies_to: ["goal:sport_performance", "season:off_season"],
    recommendation: {
      calorie_surplus_kcal: { min: 150, optimal: 250, max: 350 },
    },
    citations: [
      {
        url: "https://www.mdpi.com/2072-6643/13/9/3255",
        summary: "Modest surplus in off-season supports strength gains without excessive fat gain",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "acl_prevention_warmup",
    domain: "training",
    applies_to: ["sport:basketball", "sport:soccer", "sport:volleyball"],
    recommendation: {
      neuromuscular_warmup_minutes: { min: 5, optimal: 8, max: 10 },
      focus: "landing_mechanics_single_leg_stability",
    },
    citations: [
      {
        doi: "10.1136/bjsports-2014-094442",
        summary: "Neuromuscular warm-ups reduce lower-limb injury rates in field and court sports",
      },
    ],
    confidence: "high",
  },
  {
    id: "overhead_athlete_shoulder_care",
    domain: "training",
    applies_to: ["sport:baseball", "sport:softball", "sport:volleyball"],
    recommendation: {
      scapular_stability_sets_per_week: { min: 4, optimal: 6, max: 8 },
      priority_patterns: ["horizontal_pull", "core"],
    },
    citations: [
      {
        url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4625646/",
        summary: "Scapular and rotator cuff work supports overhead athletes",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "endurance_sport_strength",
    domain: "training",
    applies_to: ["sport:cross_country", "sport:track_field", "sport:swimming"],
    recommendation: {
      volume_multiplier: 0.8,
      priority_patterns: ["lunge", "hinge", "core"],
    },
    citations: [
      {
        url: "https://www.nsca.com/education/articles/nsca-coach/strength-training-for-distance-runners/",
        summary: "Endurance athletes benefit from low-volume strength for economy and injury resilience",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "football_contact_strength",
    domain: "training",
    applies_to: ["sport:football"],
    recommendation: {
      priority_patterns: ["squat", "hinge", "horizontal_push"],
      min_compound_exercises: 3,
    },
    citations: [
      {
        url: "https://www.nsca.com/education/articles/nsca-coach/football-strength-conditioning/",
        summary: "American football S&C emphasizes lower-body power and pressing strength",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "basketball_power_development",
    domain: "training",
    applies_to: ["sport:basketball"],
    recommendation: {
      priority_patterns: ["squat", "lunge", "vertical_push"],
      reps_range: "5-8",
    },
    citations: [
      {
        url: "https://www.nsca.com/education/articles/nsca-coach/basketball-strength-conditioning/",
        summary: "Basketball S&C prioritizes lower-body power and lateral stability",
      },
    ],
    confidence: "moderate",
  },
];
