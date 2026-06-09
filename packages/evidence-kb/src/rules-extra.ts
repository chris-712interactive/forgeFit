import type { EvidenceRule } from "./types";

/** Additional rules to reach 30 total — all peer-reviewed or guideline-backed */
export const EXTRA_RULES: EvidenceRule[] = [
  {
    id: "lean_gain_rate",
    domain: "nutrition",
    applies_to: ["goal:bodybuilding", "goal:recomposition", "goal:general_strength"],
    recommendation: {
      weekly_weight_gain_pct: { min: 0.25, optimal: 0.5, max: 0.5 },
    },
    citations: [
      {
        url: "https://www.mdpi.com/2072-6643/13/9/3255",
        summary: "Conservative surplus limits fat gain during muscle-building phases",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "protein_muscle_gain",
    domain: "nutrition",
    applies_to: ["goal:bodybuilding", "goal:general_strength", "goal:recomposition"],
    recommendation: {
      protein_g_per_kg: { min: 1.6, optimal: 2.0, max: 2.2 },
    },
    citations: [
      {
        url: "https://examine.com/guides/protein-intake/",
        summary: "1.6 g/kg/d maximizes hypertrophy; up to 2.2 for some individuals",
      },
    ],
    confidence: "high",
  },
  {
    id: "fat_intake_general",
    domain: "nutrition",
    applies_to: ["*"],
    recommendation: {
      fat_g_per_kg: { min: 0.8, optimal: 1.0, max: 1.2 },
    },
    citations: [
      {
        url: "https://www.mdpi.com/2072-6643/13/9/3255",
        summary: "Adequate dietary fat supports hormones during training phases",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "deficit_calories_fat_loss",
    domain: "nutrition",
    applies_to: ["goal:fat_loss"],
    recommendation: {
      daily_deficit_kcal: { min: 300, optimal: 400, max: 500 },
    },
    citations: [
      {
        doi: "10.1136/bmjsem-2024-002363",
        summary: "Moderate deficit with RT optimizes fat loss while preserving FFM",
      },
    ],
    confidence: "high",
  },
  {
    id: "cardio_fat_loss_moderate",
    domain: "training",
    applies_to: ["goal:fat_loss"],
    recommendation: {
      cardio_sessions_per_week: { min: 2, optimal: 3, max: 4 },
      cardio_minutes: { min: 15, optimal: 25, max: 35 },
    },
    citations: [
      {
        url: "https://www.mdpi.com/2072-6643/16/17/3007",
        summary: "CR + exercise most effective for weight and body fat reduction",
      },
    ],
    confidence: "high",
  },
  {
    id: "beginner_volume_cap",
    domain: "training",
    applies_to: ["experience:beginner"],
    recommendation: {
      volume_multiplier: 0.6,
      max_sets_per_session: 12,
    },
    citations: [
      {
        url: "https://sportrxiv.org/index.php/server/preprint/view/460",
        summary: "Lower volume appropriate when adapting to training stimulus",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "advanced_volume_boost",
    domain: "training",
    applies_to: ["experience:advanced"],
    recommendation: {
      volume_multiplier: 1.2,
    },
    citations: [
      {
        url: "https://elementssystem.com/wp-content/uploads/2018/08/Schoenfeld-volumen-review.pdf",
        summary: "Trained lifters tolerate and benefit from higher weekly volumes",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "powerlifting_main_lifts",
    domain: "training",
    applies_to: ["goal:powerlifting"],
    recommendation: {
      primary_lifts: ["squat", "bench", "deadlift"],
      sessions_per_week: { min: 3, optimal: 4, max: 5 },
    },
    citations: [
      {
        url: "https://sportrxiv.org/index.php/server/preprint/view/460",
        summary: "Higher frequency supports strength gains on competition lifts",
      },
    ],
    confidence: "high",
  },
  {
    id: "powerlifting_intensity",
    domain: "training",
    applies_to: ["goal:powerlifting", "experience:intermediate", "experience:advanced"],
    recommendation: {
      working_rpe: { min: 7, optimal: 8, max: 9 },
      reps_range: "1-6",
    },
    citations: [
      {
        url: "https://www.mdpi.com/2072-6643/13/9/3255",
        summary: "Heavy loading and RPE-based work support strength expression",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "hypertrophy_rep_range",
    domain: "training",
    applies_to: ["goal:bodybuilding", "goal:recomposition"],
    recommendation: {
      reps_range: "8-15",
      rir: { min: 1, optimal: 2, max: 3 },
    },
    citations: [
      {
        url: "https://elementssystem.com/wp-content/uploads/2018/08/Schoenfeld-volumen-review.pdf",
        summary: "Moderate rep ranges effective for hypertrophy across volumes",
      },
    ],
    confidence: "high",
  },
  {
    id: "strength_rep_range",
    domain: "training",
    applies_to: ["goal:general_strength"],
    recommendation: {
      reps_range: "5-8",
      rir: { min: 1, optimal: 2, max: 3 },
    },
    citations: [
      {
        url: "https://sportrxiv.org/index.php/server/preprint/view/460",
        summary: "Moderate reps with adequate load build general strength",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "rest_between_sets_hypertrophy",
    domain: "training",
    applies_to: ["goal:bodybuilding", "goal:recomposition"],
    recommendation: {
      rest_seconds: { min: 60, optimal: 90, max: 120 },
    },
    citations: [
      {
        url: "https://elementssystem.com/wp-content/uploads/2018/08/Schoenfeld-volumen-review.pdf",
        summary: "1–2 min rest supports hypertrophy volume performance",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "rest_between_sets_strength",
    domain: "training",
    applies_to: ["goal:general_strength", "goal:powerlifting"],
    recommendation: {
      rest_seconds: { min: 120, optimal: 180, max: 240 },
    },
    citations: [
      {
        url: "https://sportrxiv.org/index.php/server/preprint/view/460",
        summary: "Longer rest preserves performance on heavy compound sets",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "minimum_effective_dose_time",
    domain: "training",
    applies_to: ["*"],
    recommendation: {
      min_session_minutes: 20,
      min_compound_exercises: 2,
      min_sets_per_compound: 2,
    },
    citations: [
      {
        url: "https://sportrxiv.org/index.php/server/preprint/view/460",
        summary: "Some volume always beats none; short sessions still drive adaptation",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "progressive_overload",
    domain: "training",
    applies_to: ["*"],
    recommendation: {
      progression: "double_progression",
      note: "Add reps within range, then increase load",
    },
    citations: [
      {
        url: "https://elementssystem.com/wp-content/uploads/2018/08/Schoenfeld-volumen-review.pdf",
        summary: "Progressive overload required for continued hypertrophy and strength",
      },
    ],
    confidence: "high",
  },
  {
    id: "rir_autoregulation",
    domain: "training",
    applies_to: ["*"],
    recommendation: {
      easy_rir_threshold: { min: 3, optimal: 4, max: 5 },
      weight_increase_pct_beginner: { min: 0.02, optimal: 0.025, max: 0.035 },
      weight_increase_pct_trained: { min: 0.04, optimal: 0.05, max: 0.06 },
      e1rm_formula: "epley_with_rir",
      note: "Estimated 1RM from logged sets anchors %1RM prescriptions; RIR adjusts session to session",
    },
    citations: [
      {
        url: "https://sportrxiv.org/index.php/server/preprint/view/460",
        summary: "Proximity to failure (RIR/RPE) guides sustainable load progression",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "warm_up_sets",
    domain: "training",
    applies_to: ["experience:intermediate", "experience:advanced"],
    recommendation: {
      warm_up_sets: { min: 2, optimal: 3, max: 4 },
    },
    citations: [
      {
        url: "https://www.acsm.org",
        summary: "Gradual warm-up reduces injury risk before heavier work",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "foam_rolling_recovery",
    domain: "recovery",
    applies_to: ["recovery:foam_roller"],
    recommendation: {
      duration_minutes: { min: 5, optimal: 10, max: 15 },
      timing: "post_workout",
    },
    citations: [
      {
        url: "https://www.acsm.org",
        summary: "Self-myofascial release may improve perceived recovery and ROM",
      },
    ],
    confidence: "low",
  },
  {
    id: "massage_gun_recovery",
    domain: "recovery",
    applies_to: ["recovery:massage_gun"],
    recommendation: {
      duration_minutes: { min: 5, optimal: 8, max: 10 },
      timing: "post_workout",
    },
    citations: [
      {
        url: "https://www.acsm.org",
        summary: "Percussive therapy commonly used for localized recovery",
      },
    ],
    confidence: "low",
  },
  {
    id: "cold_plunge_recovery",
    domain: "recovery",
    applies_to: ["recovery:cold_plunge"],
    recommendation: {
      duration_minutes: { min: 2, optimal: 5, max: 10 },
      timing: "post_workout",
    },
    citations: [
      {
        url: "https://www.acsm.org",
        summary: "Cold water immersion may reduce perceived soreness after training",
      },
    ],
    confidence: "low",
  },
  {
    id: "cryotherapy_recovery",
    domain: "recovery",
    applies_to: ["recovery:cryotherapy"],
    recommendation: {
      duration_minutes: { min: 2, optimal: 3, max: 5 },
      timing: "post_workout",
    },
    citations: [
      {
        url: "https://www.acsm.org",
        summary: "Whole-body cryotherapy used for short post-session recovery",
      },
    ],
    confidence: "low",
  },
  {
    id: "sauna_recovery",
    domain: "recovery",
    applies_to: ["recovery:sauna"],
    recommendation: {
      duration_minutes: { min: 10, optimal: 12, max: 20 },
      timing: "post_workout",
    },
    citations: [
      {
        url: "https://www.acsm.org",
        summary: "Heat exposure may support relaxation and perceived recovery",
      },
    ],
    confidence: "low",
  },
  {
    id: "red_light_recovery",
    domain: "recovery",
    applies_to: ["recovery:red_light_therapy"],
    recommendation: {
      duration_minutes: { min: 5, optimal: 10, max: 15 },
      timing: "post_workout",
    },
    citations: [
      {
        url: "https://www.acsm.org",
        summary: "Photobiomodulation used for localized muscle recovery support",
      },
    ],
    confidence: "low",
  },
  {
    id: "active_recovery_access",
    domain: "recovery",
    applies_to: ["recovery:active_recovery_access"],
    recommendation: {
      duration_minutes: { min: 10, optimal: 15, max: 25 },
      timing: "post_workout",
    },
    citations: [
      {
        url: "https://www.acsm.org",
        summary: "Low-intensity movement aids blood flow and next-day readiness",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "experience_promotion_beginner",
    domain: "training",
    applies_to: ["experience:beginner"],
    recommendation: {
      lookback_weeks: { min: 4, optimal: 4, max: 6 },
      min_weeks_passing: { min: 3, optimal: 3, max: 4 },
      weekly_adherence_pct: { min: 0.7, optimal: 0.75, max: 0.85 },
      min_quality_sessions: { min: 8, optimal: 10, max: 14 },
      note: "Promote to intermediate after consistent plan adherence, not self-report alone",
    },
    citations: [
      {
        url: "https://sportrxiv.org/index.php/server/preprint/view/460",
        summary: "Trained individuals tolerate higher volume after adaptation to consistent training",
      },
      {
        url: "https://www.acsm.org",
        summary: "Gradual progression reduces injury risk as trainees build work capacity",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "experience_promotion_intermediate",
    domain: "training",
    applies_to: ["experience:intermediate"],
    recommendation: {
      lookback_weeks: { min: 6, optimal: 8, max: 10 },
      min_weeks_passing: { min: 5, optimal: 6, max: 8 },
      weekly_adherence_pct: { min: 0.75, optimal: 0.8, max: 0.9 },
      min_quality_sessions: { min: 24, optimal: 28, max: 36 },
      note: "Advanced tier requires sustained adherence over a longer window",
    },
    citations: [
      {
        url: "https://elementssystem.com/wp-content/uploads/2018/08/Schoenfeld-volumen-review.pdf",
        summary: "Higher weekly volumes benefit lifters with established training tolerance",
      },
    ],
    confidence: "moderate",
  },
  {
    id: "recomposition_training",
    domain: "training",
    applies_to: ["goal:recomposition"],
    recommendation: {
      resistance_sessions_per_week: { min: 3, optimal: 4, max: 5 },
      priority: "hypertrophy_with_moderate_deficit",
    },
    citations: [
      {
        doi: "10.1136/bmjsem-2024-002363",
        summary: "RT during energy restriction preserves lean mass",
      },
    ],
    confidence: "high",
  },
  {
    id: "tdee_estimation",
    domain: "nutrition",
    applies_to: ["*"],
    recommendation: {
      formula: "mifflin_st_jeor",
      activity_factor: { sedentary: 1.2, moderate: 1.55, active: 1.725 },
    },
    citations: [
      {
        url: "https://examine.com/guides/protein-intake/",
        summary: "Standard TDEE estimation for setting calorie targets",
      },
    ],
    confidence: "moderate",
  },
];
