import type { EvidenceRule } from "./types";

/**
 * Sport demand profiles for catalog sports not yet covered by hardcoded session templates.
 * `priority_patterns` are merged into generated sessions when matched.
 */
export const SPORT_CATALOG_RULES: EvidenceRule[] = [
  {
    id: "lacrosse_field_sport_strength",
    domain: "training",
    applies_to: ["sport:lacrosse_boys", "sport:lacrosse_girls"],
    recommendation: {
      priority_patterns: ["lunge", "hinge", "horizontal_push"],
      volume_multiplier: 0.85,
    },
    citations: [
      {
        doi: "10.1519/JSC.0000000000003299",
        summary:
          "Field sport athletes benefit from single-leg strength, hip power, and rotational trunk work",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "field_hockey_strength",
    domain: "training",
    applies_to: ["sport:field_hockey"],
    recommendation: {
      priority_patterns: ["hinge", "lunge", "core"],
      volume_multiplier: 0.85,
    },
    citations: [
      {
        doi: "10.1519/JSC.0000000000003299",
        summary:
          "Repeated sprint field sports need posterior chain strength and single-leg resilience",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "tennis_racquet_strength",
    domain: "training",
    applies_to: ["sport:tennis"],
    recommendation: {
      priority_patterns: ["lunge", "horizontal_pull", "core"],
      scapular_stability_sets_per_week: { min: 4, optimal: 6, max: 8 },
    },
    citations: [
      {
        doi: "10.1177/0363546516651497",
        summary:
          "Tennis players need lateral strength, trunk rotation, and shoulder stability for serve/load",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "golf_rotational_strength",
    domain: "training",
    applies_to: ["sport:golf"],
    recommendation: {
      priority_patterns: ["hinge", "core", "horizontal_pull"],
      reps_range: "6-10",
    },
    citations: [
      {
        doi: "10.1519/JSC.0000000000003299",
        summary:
          "Golf S&C emphasizes rotational power, hip mobility, and anti-rotation core stiffness",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "track_sprint_power",
    domain: "training",
    applies_to: ["sport:track_field"],
    recommendation: {
      priority_patterns: ["squat", "lunge", "hinge"],
      reps_range: "3-6",
    },
    citations: [
      {
        doi: "10.1519/JSC.0000000000003299",
        summary:
          "Sprint and jump athletes use low-rep strength work for rate-of-force development",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "swimming_pull_strength",
    domain: "training",
    applies_to: ["sport:swimming"],
    recommendation: {
      priority_patterns: ["vertical_pull", "horizontal_pull", "core"],
      scapular_stability_sets_per_week: { min: 4, optimal: 6, max: 8 },
    },
    citations: [
      {
        doi: "10.1123/ijspp.2015-0349",
        summary:
          "Swimmers benefit from dry-land pull strength and shoulder prehab without excessive hypertrophy volume",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "wrestling_combat_strength",
    domain: "training",
    applies_to: ["sport:wrestling"],
    recommendation: {
      priority_patterns: ["hinge", "carry", "core"],
      min_compound_exercises: 3,
      volume_multiplier: 0.8,
    },
    citations: [
      {
        doi: "10.1519/JSC.0000000000003299",
        summary:
          "Combat athletes emphasize isometric grip, neck-safe posterior chain, and repeated power",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "ice_hockey_skating_power",
    domain: "training",
    applies_to: ["sport:ice_hockey"],
    recommendation: {
      priority_patterns: ["squat", "lunge", "hinge"],
      reps_range: "4-8",
    },
    citations: [
      {
        doi: "10.1519/JSC.0000000000003299",
        summary:
          "Hockey S&C targets skating power, hip abduction strength, and contact readiness",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "competitive_cheer_tumbling",
    domain: "training",
    applies_to: ["sport:competitive_cheer"],
    recommendation: {
      priority_patterns: ["squat", "lunge", "core"],
      reps_range: "5-8",
      neuromuscular_warmup_minutes: { min: 5, optimal: 8, max: 10 },
      focus: "landing_mechanics_single_leg_stability",
      session_template_note:
        "Jump & Land, Stunt Prep, Core Stability, Power Maintenance weekly split",
    },
    citations: [
      {
        doi: "10.1136/bjsports-2014-094442",
        summary:
          "Neuromuscular warm-ups reduce lower-limb injury rates in jumping athletes",
      },
      {
        doi: "10.1542/peds.2019-1285",
        summary:
          "AAP: cheerleading injury prevention emphasizes proper landing technique and supervised progressions",
      },
    ],
    confidence: "high",
  },
  {
    id: "competitive_cheer_stunting_shoulder_care",
    domain: "training",
    applies_to: ["sport:competitive_cheer"],
    recommendation: {
      priority_patterns: ["horizontal_pull", "vertical_push", "core"],
      scapular_stability_sets_per_week: { min: 4, optimal: 6, max: 8 },
      min_compound_exercises: 2,
    },
    citations: [
      {
        doi: "10.1177/0363546516651497",
        summary:
          "Overhead and pressing athletes need scapular stability and rotator cuff balance for shoulder health",
      },
      {
        url: "https://www.nsca.com/education/articles/nsca-coach/strength-training-for-cheerleading/",
        summary:
          "Cheer S&C programs include shoulder prehab for bases and flyers during stunting",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "competitive_cheer_volume_cap",
    domain: "training",
    applies_to: ["sport:competitive_cheer"],
    recommendation: {
      volume_multiplier: 0.75,
      max_sets_per_session: 12,
      note: "Conservative gym volume — tumbling and stunting practice carry high neuromuscular load",
    },
    citations: [
      {
        doi: "10.1519/JSC.0b013e3181e3807b",
        summary:
          "Youth and aesthetic sport athletes need load-managed S&C alongside high skill-practice volume",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "competitive_cheer_in_season_load",
    domain: "training",
    applies_to: ["sport:competitive_cheer", "season:in_season"],
    recommendation: {
      volume_multiplier: 0.65,
      max_gym_sessions_per_week: 2,
      note: "Competition season — maintain strength, prioritize recovery between performances",
    },
    citations: [
      {
        doi: "10.3390/nu13093255",
        summary:
          "In-season athletes reduce auxiliary training volume to preserve performance and reduce overuse injury",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "protein_competitive_cheer",
    domain: "nutrition",
    applies_to: ["sport:competitive_cheer"],
    recommendation: {
      protein_g_per_kg: { min: 1.6, optimal: 1.8, max: 2.2 },
    },
    citations: [
      {
        doi: "10.1186/s12970-017-0177-8",
        summary:
          "Intermittent high-intensity athletes benefit from 1.6–2.2 g/kg/day for recovery between sessions",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "gymnastics_relative_strength",
    domain: "training",
    applies_to: ["sport:gymnastics"],
    recommendation: {
      priority_patterns: ["vertical_pull", "core", "horizontal_push"],
      volume_multiplier: 0.7,
      max_sets_per_session: 12,
    },
    citations: [
      {
        doi: "10.1519/JSC.0b013e3181e3807b",
        summary:
          "Gymnasts need relative strength and load-managed shoulder/wrist prep with conservative volume",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "flag_football_speed_agility",
    domain: "training",
    applies_to: ["sport:flag_football"],
    recommendation: {
      priority_patterns: ["lunge", "squat", "horizontal_pull"],
      volume_multiplier: 0.85,
      neuromuscular_warmup_minutes: { min: 5, optimal: 8, max: 10 },
    },
    citations: [
      {
        doi: "10.1519/JSC.0000000000003299",
        summary:
          "Non-contact field sports emphasize sprint mechanics, change of direction, and single-leg resilience",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "water_polo_aquatic_strength",
    domain: "training",
    applies_to: ["sport:water_polo"],
    recommendation: {
      priority_patterns: ["vertical_pull", "lunge", "core"],
      scapular_stability_sets_per_week: { min: 4, optimal: 6, max: 8 },
      volume_multiplier: 0.85,
    },
    citations: [
      {
        doi: "10.1123/ijspp.2015-0349",
        summary:
          "Aquatic athletes need dry-land pull strength, treading leg power, and shoulder prehab",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "rowing_posterior_chain",
    domain: "training",
    applies_to: ["sport:rowing"],
    recommendation: {
      priority_patterns: ["hinge", "horizontal_pull", "core"],
      reps_range: "6-10",
      volume_multiplier: 0.85,
    },
    citations: [
      {
        url: "https://www.nsca.com/education/articles/nsca-coach/strength-training-for-rowing/",
        summary:
          "Rowing S&C targets posterior chain power, grip endurance, and trunk stiffness for stroke efficiency",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "soccer_single_leg_strength",
    domain: "training",
    applies_to: ["sport:soccer"],
    recommendation: {
      priority_patterns: ["lunge", "hinge", "core"],
      neuromuscular_warmup_minutes: { min: 5, optimal: 8, max: 10 },
    },
    citations: [
      {
        doi: "10.1136/bjsports-2014-094442",
        summary:
          "Soccer neuromuscular warm-ups (FIFA 11+) reduce injury incidence in youth and adult players",
      },
    ],
    confidence: "high",
  },
  {
    id: "volleyball_jump_land_strength",
    domain: "training",
    applies_to: ["sport:volleyball"],
    recommendation: {
      priority_patterns: ["squat", "lunge", "vertical_push"],
      neuromuscular_warmup_minutes: { min: 5, optimal: 8, max: 10 },
    },
    citations: [
      {
        doi: "10.1136/bjsports-2014-094442",
        summary:
          "Jump-landing mechanics training reduces ACL injury risk in volleyball athletes",
      },
    ],
    confidence: "high",
  },
  {
    id: "sport_hybrid_nutrition_priority",
    domain: "nutrition",
    applies_to: ["goal:sport_performance"],
    recommendation: {
      nutrition_priority_stack: [
        "in_season_maintenance",
        "secondary_fat_loss",
        "secondary_recomposition",
        "secondary_hypertrophy_strength",
        "off_season_surplus",
      ],
      note: "In-season maintenance overrides hybrid physique goals; off-season surplus when no secondary goal",
    },
    citations: [
      {
        doi: "10.3390/nu13093255",
        summary:
          "Athlete nutrition periodization: energy needs shift by season phase and training load",
      },
    ],
    confidence: "moderate",
  },
];
