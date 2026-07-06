export const KNOWN_ADMIN_FEATURE_FLAGS = [
  {
    key: "beta_integrations",
    label: "Beta integrations",
    description: "Early access to new wearable integrations.",
  },
  {
    key: "early_ai_coach",
    label: "Early AI coach",
    description: "Preview AI coaching copy experiments.",
  },
  {
    key: "internal_tester",
    label: "Internal tester",
    description: "Marks account for internal QA (no prod impact alone).",
  },
] as const;

export type AdminFeatureFlagKey =
  (typeof KNOWN_ADMIN_FEATURE_FLAGS)[number]["key"];
