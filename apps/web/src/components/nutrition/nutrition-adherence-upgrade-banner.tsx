import { UpgradePrompt } from "@/components/billing/upgrade-prompt";

const ADHERENCE_UPGRADE_MIN_DAYS = 28;

interface NutritionAdherenceUpgradeBannerProps {
  loggedDayCount: number;
  unlocked: boolean;
}

export function NutritionAdherenceUpgradeBanner({
  loggedDayCount,
  unlocked,
}: NutritionAdherenceUpgradeBannerProps) {
  if (unlocked || loggedDayCount < ADHERENCE_UPGRADE_MIN_DAYS) {
    return null;
  }

  return (
    <UpgradePrompt
      title="Four weeks of logs — see your adherence"
      description={`You've logged ${loggedDayCount} days. Pro shows how consistently you hit protein and calories over 7, 30, and 90 days.`}
      suggestedTier="pro"
    />
  );
}
