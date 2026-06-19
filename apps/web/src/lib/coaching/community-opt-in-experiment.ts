import { createAdminClient } from "@/lib/supabase/admin";

export type CommunityOptInVariant = "control" | "default_on_ui";

function hashBucket(userId: string): number {
  let hash = 0;
  for (let index = 0; index < userId.length; index += 1) {
    hash = (hash * 31 + userId.charCodeAt(index)) >>> 0;
  }
  return hash % 100;
}

export function isOptInAbEnabled(): boolean {
  return process.env.COMMUNITY_OPT_IN_AB_ENABLED === "true";
}

export function resolveOptInVariant(userId: string): CommunityOptInVariant {
  const percent = Number.parseInt(
    process.env.COMMUNITY_OPT_IN_AB_DEFAULT_ON_PERCENT ?? "50",
    10
  );
  const threshold = Number.isFinite(percent)
    ? Math.min(100, Math.max(0, percent))
    : 50;
  return hashBucket(userId) < threshold ? "default_on_ui" : "control";
}

export async function ensureOptInVariantAssigned(input: {
  userId: string;
  storedVariant: string | null | undefined;
  optedIn: boolean;
}): Promise<CommunityOptInVariant> {
  if (input.optedIn || !isOptInAbEnabled()) {
    return input.storedVariant === "default_on_ui" ? "default_on_ui" : "control";
  }

  if (input.storedVariant === "default_on_ui") {
    return "default_on_ui";
  }

  const variant = resolveOptInVariant(input.userId);
  if (variant === input.storedVariant) {
    return variant;
  }

  try {
    const admin = createAdminClient();
    await admin
      .from("profiles")
      .update({
        community_opt_in_variant: variant,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.userId);
  } catch {
    // Non-fatal — UI falls back to control.
  }

  return variant;
}

export function defaultOnUiCopy(variant: CommunityOptInVariant): {
  heroTitle: string;
  heroBody: string;
  joinLabel: string;
  settingsHint: string;
} {
  if (variant === "default_on_ui") {
    return {
      heroTitle: "Ready to compete?",
      heroBody:
        "Most athletes in your bucket join weekly leaderboards. Only your first name appears — turn off anytime in Profile.",
      joinLabel: "Join community",
      settingsHint:
        "Recommended for your bucket. First name only; you can opt out anytime.",
    };
  }

  return {
    heroTitle: "Join to compete on the board",
    heroBody:
      "First name only. Share your weekly score, find rivals, and cheer wins.",
    joinLabel: "Join community",
    settingsHint: "Off by default. Shows your first name only.",
  };
}
