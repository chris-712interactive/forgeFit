import { SignOutButton } from "@/components/auth/sign-out-button";
import { appHeaderGap, appPagePadding, appSectionStack } from "@/components/layout/page-layout";
import { CollapsibleSection } from "@/components/layout/collapsible-section";
import { LegalFooter } from "@/components/legal/legal-document";
import { PrivacyDataSetting } from "@/components/profile/privacy-data-setting";
import { ProfileSettingsHub } from "@/components/profile/profile-settings-hub";
import { getUserEquipmentSettings } from "@/lib/equipment/service";
import { getUserOneRepMaxes } from "@/lib/progression/user-maxes";
import { getCommunityEmailSettings } from "@/lib/coaching/community-email";
import { getCommunityPushSettings } from "@/lib/coaching/community-push";
import { getWeighInPushSettings } from "@/lib/coaching/progress-push";
import { getSubscriptionForUser } from "@/lib/billing/subscription";
import { hasFeature } from "@/lib/billing/gates";
import { isStripeProConfigured } from "@/lib/billing/stripe";
import {
  buildIntegrationsHubView,
  listIntegrationStatuses,
} from "@/lib/integrations/service";
import { getSpotifyPublicStatus } from "@/lib/integrations/spotify-service";
import { scheduleFitbitBackgroundSync } from "@/lib/integrations/fitbit-sync-scheduler";
import {
  isDeviceIntegrationsConfigured,
  isFitbitIntegrationConfigured,
  isStravaConfigured,
  isWithingsConfigured,
  withingsOAuthRedirectUri,
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
    spotify?: string;
    spotify_error?: string;
  }>;
}) {
  const params = await searchParams;
  const checkoutStatus =
    params.checkout === "success" || params.checkout === "canceled"
      ? params.checkout
      : null;
  const integrationStatus = params.integration ?? null;
  const integrationError = params.integration_error ?? null;
  const spotifyStatus = params.spotify ?? null;
  const spotifyError = params.spotify_error ?? null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select(
          "*, workout_music_auto_start, workout_music_default_vibe"
        )
        .eq("id", user.id)
        .single()
    : { data: null };

  const unit = normalizeUnitSystem(profile?.unit_system);

  const [oneRepMaxes, equipmentSettings, subscription, communityPush, communityEmail, weighInPush] = user
    ? await Promise.all([
        getUserOneRepMaxes(user.id),
        getUserEquipmentSettings(user.id),
        getSubscriptionForUser(user.id),
        getCommunityPushSettings(user.id),
        getCommunityEmailSettings(user.id),
        getWeighInPushSettings(user.id),
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
            weeklyWeighInNudge: true,
          },
        },
        { configured: false, weeklyRecap: true },
        {
          configured: false,
          subscribed: false,
          weeklyWeighInNudge: true,
        },
      ];

  const integrationsUnlocked = hasFeature(subscription, "device_integrations");
  if (user && integrationsUnlocked) {
    await scheduleFitbitBackgroundSync(user.id, subscription);
  }

  let initialIntegrations = buildIntegrationsHubView([]);
  let integrationsLoadError: string | null = null;
  let spotifyMusic = {
    configured: false,
    connected: false,
    autoStart: false,
    defaultVibe: null as import("@/lib/workout-music/catalog").WorkoutMusicVibe | null,
    lastError: null as string | null,
  };

  if (user) {
    try {
      spotifyMusic = await getSpotifyPublicStatus(user.id, profile);
    } catch {
      spotifyMusic = {
        configured: false,
        connected: false,
        autoStart: profile?.workout_music_auto_start ?? false,
        defaultVibe: null,
        lastError: null,
      };
    }
  }

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

      <div className={`${appHeaderGap} ${appSectionStack}`}>
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
          providerOAuthRedirectUris={
            isWithingsConfigured()
              ? { withings: withingsOAuthRedirectUri() }
              : undefined
          }
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
          communityEmail={communityEmail}
          weighInPush={weighInPush}
          unit={unit}
          initialGoal={profile?.primary_goal ?? null}
          initialFatLossPace={profile?.fat_loss_pace ?? null}
          initialRecompPriority={profile?.recomp_priority ?? null}
          initialGoalWeightKg={
            profile?.goal_weight_kg != null
              ? Number(profile.goal_weight_kg)
              : null
          }
          initialCurrentWeightKg={
            profile?.weight_kg != null ? Number(profile.weight_kg) : null
          }
          initialSessionsPerWeek={profile?.sessions_per_week ?? null}
          initialMinutesPerSession={profile?.minutes_per_session ?? null}
          initialSportId={profile?.sport_id ?? null}
          initialSportPositionId={profile?.sport_position_id ?? null}
          initialSportSeasonPhase={profile?.sport_season_phase ?? null}
          initialSecondaryGoal={profile?.secondary_goal ?? null}
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
          spotifyMusic={spotifyMusic}
          spotifyStatus={spotifyStatus}
          spotifyError={spotifyError}
        />

        <section
          aria-label="Account actions"
          className="flex flex-col gap-4 border-t border-[var(--border)] pt-6 sm:gap-5 sm:pt-8"
        >
          {user?.email && (
            <CollapsibleSection title="Privacy & data" hint="Export or delete">
              <p className="mb-4 text-xs text-forge-muted">
                Download everything ForgeRep stores about you, or permanently delete
                your account and all associated data.
              </p>
              <PrivacyDataSetting
                email={user.email}
                userId={user.id}
                canExport={hasProAccess(subscription)}
              />
            </CollapsibleSection>
          )}

          <SignOutButton />

          <LegalFooter className="pt-1 text-center text-xs sm:pt-2" />
        </section>
      </div>
    </div>
  );
}
