import type { Citation, EvidenceRule } from "@forgefit/evidence-kb";

export type EvidenceDomain = EvidenceRule["domain"];

export const DOMAIN_LABELS: Record<EvidenceDomain, string> = {
  nutrition: "Nutrition",
  training: "Training",
  recovery: "Recovery",
  supplements: "Supplements",
};

export const CONFIDENCE_LABELS = {
  high: "High confidence",
  moderate: "Moderate confidence",
  low: "Emerging evidence",
} as const;

const RULE_COPY: Record<string, { title: string; summary: string }> = {
  fat_loss_rate: {
    title: "Fat loss rate",
    summary: "Caps weekly weight loss to preserve lean mass during a cut.",
  },
  protein_deficit_general: {
    title: "Protein during a deficit",
    summary: "Sets protein high enough to protect muscle while you lose fat.",
  },
  protein_deficit_overweight: {
    title: "Protein for higher BMI",
    summary: "Adjusts protein targets when BMI is elevated.",
  },
  protein_athlete_cut: {
    title: "Protein for advanced cuts",
    summary: "Higher protein for trained lifters in aggressive fat-loss phases.",
  },
  resistance_training_during_deficit: {
    title: "Lift while dieting",
    summary: "Keeps resistance training in the plan to preserve lean mass.",
  },
  hypertrophy_weekly_volume: {
    title: "Hypertrophy volume",
    summary: "Sets weekly hard sets per muscle in the evidence-backed range.",
  },
  strength_training_frequency: {
    title: "Strength frequency",
    summary: "Trains main patterns often enough to drive strength gains.",
  },
  creatine_supplementation: {
    title: "Creatine",
    summary: "Recommends creatine monohydrate for strength and hypertrophy goals.",
  },
  recovery_sleep: {
    title: "Sleep for recovery",
    summary: "Targets 7–9 hours of sleep as a baseline recovery habit.",
  },
  deload_intermediate: {
    title: "Deload timing",
    summary: "Schedules periodic deloads to manage accumulated fatigue.",
  },
  lean_gain_rate: {
    title: "Lean gain pace",
    summary: "Uses a conservative surplus to limit unnecessary fat gain.",
  },
  protein_muscle_gain: {
    title: "Protein for muscle gain",
    summary: "Sets protein for hypertrophy and strength-building phases.",
  },
  fat_intake_general: {
    title: "Dietary fat floor",
    summary: "Keeps enough fat in the diet for hormones and adherence.",
  },
  deficit_calories_fat_loss: {
    title: "Calorie deficit size",
    summary: "Sizes the daily deficit for sustainable fat loss.",
  },
  cardio_fat_loss_moderate: {
    title: "Cardio for fat loss",
    summary: "Adds moderate cardio as an adjunct to resistance training.",
  },
  beginner_volume_cap: {
    title: "Beginner volume cap",
    summary: "Limits training volume while you adapt to new stimulus.",
  },
  advanced_volume_boost: {
    title: "Advanced volume tolerance",
    summary: "Allows higher volume for experienced lifters.",
  },
  powerlifting_main_lifts: {
    title: "Powerlifting focus",
    summary: "Centers the plan on squat, bench, and deadlift patterns.",
  },
  powerlifting_intensity: {
    title: "Powerlifting intensity",
    summary: "Prioritizes heavier loading on competition lifts.",
  },
  hypertrophy_rep_range: {
    title: "Hypertrophy rep range",
    summary: "Uses rep ranges that maximize muscle-building stimulus.",
  },
  strength_rep_range: {
    title: "Strength rep range",
    summary: "Uses lower reps to prioritize force production.",
  },
  rest_between_sets_hypertrophy: {
    title: "Rest for hypertrophy",
    summary: "Sets rest periods suited to muscle-building work.",
  },
  rest_between_sets_strength: {
    title: "Rest for strength",
    summary: "Uses longer rest so heavy sets stay high quality.",
  },
  minimum_effective_dose_time: {
    title: "Minimum effective dose",
    summary: "Fits meaningful work into your available session time.",
  },
  progressive_overload: {
    title: "Progressive overload",
    summary: "Builds in progression so sessions keep driving adaptation.",
  },
  rir_autoregulation: {
    title: "RIR autoregulation",
    summary:
      "Uses your logged effort (Easy / Good / Hard) to nudge weight, reps, and volume on the next session.",
  },
  warm_up_sets: {
    title: "Warm-up sets",
    summary: "Includes ramp-up sets before heavier work.",
  },
  foam_rolling_recovery: {
    title: "Foam rolling",
    summary: "Adds self-myofascial release after training.",
  },
  massage_gun_recovery: {
    title: "Percussive therapy",
    summary: "Adds localized percussive recovery after sessions.",
  },
  cold_plunge_recovery: {
    title: "Cold exposure",
    summary: "Adds brief cold immersion for perceived recovery support.",
  },
  cryotherapy_recovery: {
    title: "Cryotherapy",
    summary: "Adds short whole-body cold sessions after training.",
  },
  sauna_recovery: {
    title: "Sauna",
    summary: "Adds heat exposure for relaxation and recovery.",
  },
  red_light_recovery: {
    title: "Red light therapy",
    summary: "Adds photobiomodulation for localized recovery support.",
  },
  active_recovery_access: {
    title: "Active recovery",
    summary: "Adds low-intensity movement to promote blood flow.",
  },
  recomposition_training: {
    title: "Recomposition training",
    summary: "Balances hypertrophy work with a slight calorie deficit.",
  },
  tdee_estimation: {
    title: "Calorie estimation",
    summary: "Estimates maintenance calories from your profile data.",
  },
  experience_promotion_beginner: {
    title: "Beginner → intermediate promotion",
    summary:
      "Elevates experience tier after consistent weekly adherence, unlocking more volume and exercise complexity.",
  },
  experience_promotion_intermediate: {
    title: "Intermediate → advanced promotion",
    summary:
      "Requires a longer streak of high adherence before assigning advanced training tolerance.",
  },
};

const RECOMMENDATION_LABELS: Record<string, string> = {
  protein_g_per_kg: "Protein",
  fat_g_per_kg: "Fat",
  meal_frequency: "Meals per day",
  weekly_bodyweight_loss_pct: "Weekly weight loss",
  weekly_weight_gain_pct: "Weekly weight gain",
  daily_deficit_kcal: "Daily calorie deficit",
  resistance_sessions_per_week: "Resistance sessions / week",
  hard_sets_per_muscle_per_week: "Hard sets / muscle / week",
  frequency_per_lift_per_week: "Frequency / lift / week",
  creatine_monohydrate_g_per_day: "Creatine",
  sleep_hours: "Sleep",
  deload_every_weeks: "Deload every",
  volume_reduction_pct: "Deload volume reduction",
  cardio_sessions_per_week: "Cardio sessions / week",
  cardio_minutes: "Cardio minutes",
  volume_multiplier: "Volume multiplier",
  max_sets_per_session: "Max sets / session",
  sessions_per_week: "Sessions / week",
  reps_range: "Rep range",
  rest_seconds: "Rest between sets",
  duration_minutes: "Duration",
  warm_up_sets: "Warm-up sets",
  formula: "Formula",
  timing: "Timing",
  note: "Note",
  priority: "Priority",
  primary_lifts: "Primary lifts",
};

export function getRuleTitle(rule: EvidenceRule): string {
  return RULE_COPY[rule.id]?.title ?? humanizeId(rule.id);
}

export function getRuleSummary(rule: EvidenceRule): string {
  return (
    RULE_COPY[rule.id]?.summary ??
    "This rule shapes part of your program or nutrition targets."
  );
}

export function getDomainLabel(domain: EvidenceDomain): string {
  return DOMAIN_LABELS[domain] ?? humanizeId(domain);
}

export function citationHref(citation: Citation): string | null {
  if (citation.url) return citation.url;
  if (citation.doi) return `https://doi.org/${citation.doi}`;
  return null;
}

export function citationLabel(citation: Citation): string {
  if (citation.doi) return `DOI ${citation.doi}`;
  if (citation.url) {
    try {
      const host = new URL(citation.url).hostname.replace(/^www\./, "");
      return host;
    } catch {
      return "Source";
    }
  }
  return "Source";
}

export function formatAppliesTo(tags: string[]): string[] {
  return tags.map((tag) => {
    if (tag === "*") return "All users";
    const [key, value] = tag.split(":");
    switch (key) {
      case "goal":
        return `Goal: ${humanizeId(value)}`;
      case "experience":
        return `Experience: ${humanizeId(value)}`;
      case "recovery":
        return `Recovery tool: ${humanizeId(value)}`;
      case "bmi_gte":
        return `BMI ≥ ${value}`;
      default:
        return humanizeId(tag);
    }
  });
}

export function formatRecommendationLines(
  recommendation: Record<string, unknown>
): string[] {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(recommendation)) {
    if (value == null) continue;
    const label = RECOMMENDATION_LABELS[key] ?? humanizeId(key);

    if (typeof value === "object" && !Array.isArray(value)) {
      const range = value as { min?: number; optimal?: number; max?: number };
      if ("optimal" in range || "min" in range || "max" in range) {
        lines.push(`${label}: ${formatRange(range)}`);
        continue;
      }
    }

    if (Array.isArray(value)) {
      lines.push(`${label}: ${value.join(", ")}`);
      continue;
    }

    lines.push(`${label}: ${String(value)}`);
  }

  return lines;
}

export function buildEvidenceHref(options?: {
  focus?: string;
  related?: string[];
}): string {
  const params = new URLSearchParams();
  if (options?.focus) params.set("focus", options.focus);
  if (options?.related?.length) {
    params.set("related", options.related.filter(Boolean).join(","));
  }
  const query = params.toString();
  return query ? `/evidence?${query}` : "/evidence";
}

function formatRange(range: {
  min?: number;
  optimal?: number;
  max?: number;
}): string {
  const { min, optimal, max } = range;
  if (min != null && optimal != null && max != null) {
    return `${min}–${max} (target ${optimal})`;
  }
  if (optimal != null && max != null) {
    return `up to ${max} (target ${optimal})`;
  }
  if (min != null && optimal != null) {
    return `${min}+ (target ${optimal})`;
  }
  if (optimal != null) return String(optimal);
  if (min != null && max != null) return `${min}–${max}`;
  if (min != null) return `≥ ${min}`;
  if (max != null) return `≤ ${max}`;
  return "—";
}

function humanizeId(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
