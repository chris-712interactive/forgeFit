export type BroadcastSegment =
  | "all_users"
  | "paid_users"
  | "free_users"
  | "pro_users"
  | "pro_plus_users"
  | "community_opt_in"
  | "onboarding_incomplete";

export const BROADCAST_SEGMENTS: Array<{
  id: BroadcastSegment;
  label: string;
  description: string;
}> = [
  {
    id: "all_users",
    label: "All users",
    description: "Every profile with an email address.",
  },
  {
    id: "paid_users",
    label: "Paid users",
    description: "Pro or Pro+ with active/trialing status.",
  },
  {
    id: "free_users",
    label: "Free tier",
    description: "Free tier or inactive subscription.",
  },
  {
    id: "pro_users",
    label: "Pro only",
    description: "Active Pro subscribers.",
  },
  {
    id: "pro_plus_users",
    label: "Pro+ only",
    description: "Active Pro+ subscribers.",
  },
  {
    id: "community_opt_in",
    label: "Community opt-in",
    description: "Users with gamification_opt_in enabled.",
  },
  {
    id: "onboarding_incomplete",
    label: "Onboarding incomplete",
    description: "Signed up but onboarding not finished.",
  },
];
