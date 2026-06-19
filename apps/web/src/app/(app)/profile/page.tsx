import { SignOutButton } from "@/components/auth/sign-out-button";
import { appHeaderGap, appPagePadding } from "@/components/layout/page-layout";
import { LegalFooter } from "@/components/legal/legal-document";
import { PrivacyDataSetting } from "@/components/profile/privacy-data-setting";
import { ProfileSettingsHub } from "@/components/profile/profile-settings-hub";
import { getUserEquipmentSettings } from "@/lib/equipment/service";
import { getUserOneRepMaxes } from "@/lib/progression/user-maxes";
import { getCommunityPushSettings } from "@/lib/coaching/community-push";
import { getSubscriptionForUser } from "@/lib/billing/subscription";
import { hasFeature } from "@/lib/billing/gates";
import { isStripeProConfigured } from "@/lib/billing/stripe";
import {
  buildIntegrationsHubView,
  listIntegrationStatuses,
} from "@/lib/integrations/service";
import { scheduleFitbitBackgroundSync } from "@/lib/integrations/fitbit-sync-scheduler";
import {
  isDeviceIntegrationsConfigured,
  isFitbitIntegrationConfigured,
  isStravaConfigured,
  isWithingsConfigured,
} from "@/lib/integrations/config";
import { hasProAccess } from "@/lib/billing/types";
import { createClient } from "@/lib/supabase/server";
import {
  formatHeight,
  formatWeight,
  normalizeUnitSystem,
} from "@/lib/units/measurements";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{
    checkout?: string;
    integration?: string;
    integration_error?: string;
  }>;
}) {
  const params = await searchParams;
  const checkoutStatus =
    params.checkout === "success" || params.checkout === "canceled"
      ? params.checkout
      : null;
  const integrationStatus = params.integration ?? null;
  const integrationError = params.integration_error ?? null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
    : { data: null };

  const unit = normalizeUnitSystem(profile?.unit_system);

  const [oneRepMaxes, equipmentSettings, subscription, communityPush] = user
    ? await Promise.all([
        getUserOneRepMaxes(user.id),
        getUserEquipmentSettings(user.id),
        getSubscriptionForUser(user.id),
        getCommunityPushSettings(user.id),
      ])
    : [
        { rows: [], tableReady: true },
        {
          equipment: [],
          equipmentLocation: "gym" as const,
          recoveryEquipment: [],
          isTravelMode: false,
          homeEquipment: [],
          homeRecoveryEquipment: [],
          homeEquipmentLocation: null,
          travelModeReady: false,
        },
        {
          tier: "free" as const,
          status: "inactive" as const,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        },
        {
          configured: false,
          subscribed: false,
          preferences: {
            rankPassed: true,
            closeToPass: true,
            rivalEvents: true,
            cheerReceived: true,
            followMutual: true,
            sundayNudge: true,
          },
        },
      ];

  const integrationsUnlocked = hasFeature(subscription, "device_integrations");
  if (user && integrationsUnlocked) {
    await scheduleFitbitBackgroundSync(user.id, subscription);
  }

  let initialIntegrations = buildIntegrationsHubView([]);
  let integrationsLoadError: string | null = null;
  if (user && integrationsUnlocked) {
    try {
      const statuses = await listIntegrationStatuses(user.id);
      initialIntegrations = buildIntegrationsHubView(statuses);
    } catch (error) {
      integrationsLoadError =
        error instanceof Error
          ? error.message
          : "Could not load integration status.";
      initialIntegrations = buildIntegrationsHubView([]);
    }
  }

  return (
    <div className={appPagePadding}>
      <h1 className="font-display text-2xl font-bold text-forge-text">Profile</h1>
      <p className="mt-2 text-forge-muted">{user?.email}</p>

      <div className={appHeaderGap}>
        <ProfileSettingsHub
          subscription={subscription}
          stripeConfigured={isStripeProConfigured()}
          checkoutStatus={checkoutStatus}
          integrationsUnlocked={integrationsUnlocked}
          integrationsConfigured={isDeviceIntegrationsConfigured()}
          providerConfigured={{
            withings: isWithingsConfigured(),
            fitbit: isFitbitIntegrationConfigured(),
            strava: isStravaConfigured(),
          }}
          initialIntegrations={initialIntegrations}
          integrationStatus={integrationStatus}
          integrationError={integrationError ?? integrationsLoadError}
          gamificationUnlocked={hasFeature(subscription, "gamification")}
          gamificationOptIn={profile?.gamification_opt_in ?? false}
          communityOptInVariant={
            profile?.community_opt_in_variant === "default_on_ui"
              ? "default_on_ui"
              : "control"
          }
          communityPush={communityPush}
          unit={unit}
          initialGoal={profile?.primary_goal ?? null}
          initialSessionsPerWeek={profile?.sessions_per_week ?? null}
          initialMinutesPerSession={profile?.minutes_per_session ?? null}
          equipmentSettings={equipmentSettings}
          oneRepMaxes={oneRepMaxes.rows}
          oneRepMaxesTableReady={oneRepMaxes.tableReady}
          experienceLevel={profile?.experience_level}
          weightLabel={
            profile?.weight_kg
              ? formatWeight(Number(profile.weight_kg), unit)
              : undefined
          }
          heightLabel={
            profile?.height_cm
              ? formatHeight(Number(profile.height_cm), unit)
              : undefined
          }
        />

        <LegalFooter />

        {user?.email && (
          <PrivacyDataSetting
            email={user.email}
            userId={user.id}
            canExport={hasProAccess(subscription)}
          />
        )}

        <SignOutButton />
      </div>
    </div>
  );
}
