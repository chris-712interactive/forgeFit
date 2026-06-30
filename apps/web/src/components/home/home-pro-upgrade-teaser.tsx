import { ProFeatureSection } from "@/components/billing/pro-feature-section";
import { UpgradePrompt } from "@/components/billing/upgrade-prompt";

export function HomeProUpgradeTeaser() {
  return (
    <ProFeatureSection
      title="Pro insights"
      description="Weekly scorecard, trend insights, and 90-day projections when you upgrade."
      unlocked={false}
    >
      <UpgradePrompt
        title="See the full picture"
        description="Pro connects your training, nutrition, and progress with 90-day forecasts and adherence analytics."
        suggestedTier="pro"
      />
    </ProFeatureSection>
  );
}
