"use client";

import Link from "next/link";
import { CollapsibleSection } from "@/components/layout/collapsible-section";
import { CommunityEmailSetting } from "@/components/profile/community-email-setting";
import { CommunityPushSetting } from "@/components/profile/community-push-setting";
import { WeighInPushSetting } from "@/components/profile/weigh-in-push-setting";
import type { CommunityEmailSettings } from "@/lib/coaching/community-email";
import type { CommunityPushSettings } from "@/lib/coaching/community-push";
import type { WeighInPushSettings } from "@/lib/coaching/progress-push";
import { isWeighInReminderGoal } from "@/lib/measurements/weigh-in-reminder";
import { EquipmentSetting } from "@/components/profile/equipment-setting";
import { GamificationSetting } from "@/components/profile/gamification-setting";
import { IntegrationsSetting } from "@/components/profile/integrations-setting";
import { OneRepMaxSetting } from "@/components/profile/one-rep-max-setting";
import { ProgramPlanSetting } from "@/components/profile/program-plan-setting";
import { SubscriptionSetting } from "@/components/profile/subscription-setting";
import { WorkoutMusicSetting } from "@/components/profile/workout-music-setting";
import { UnitPreferenceSetting } from "@/components/profile/unit-preference-setting";
import type { SpotifyPublicStatus } from "@/lib/integrations/spotify-service";
import type { SubscriptionSnapshot } from "@/lib/billing/types";
import { hasProAccess, hasProPlusAccess } from "@/lib/billing/types";
import type { UserEquipmentSettings } from "@/lib/equipment/service";
import {
  formatEquipmentHint,
  formatProgramPlanHint,
} from "@/lib/profile/plan-hints";
import type { IntegrationPublicStatus } from "@/lib/integrations/types";
import type { UserOneRepMaxRow } from "@/lib/progression/user-maxes";
import type {
  ExperienceLevel,
  FatLossPace,
  FitnessGoal,
  RecompPriority,
  SportPracticeGymPolicy,
  SportSeasonPhase,
  UnitSystem,
} from "@/lib/types/profile";
import type { IntegrationProvider } from "@forgefit/integrations";

type HubIntegration = IntegrationPublicStatus & {
  label: string;
  description: string;
  available: boolean;
};

interface ProfileSettingsHubProps {
  userId: string;
  subscription: SubscriptionSnapshot;
  stripeConfigured: boolean;
  checkoutStatus: "success" | "canceled" | null;
  integrationsUnlocked: boolean;
  integrationsConfigured: boolean;
  providerConfigured: Partial<Record<IntegrationProvider, boolean>>;
  providerOAuthRedirectUris?: Partial<Record<IntegrationProvider, string>>;
  initialIntegrations: HubIntegration[];
  integrationStatus: string | null;
  integrationError: string | null;
  gamificationUnlocked: boolean;
  gamificationOptIn: boolean;
  communityOptInVariant?: import("@/lib/coaching/types").CommunityOptInVariant;
  communityPush: CommunityPushSettings;
  communityEmail: CommunityEmailSettings;
  weighInPush: WeighInPushSettings;
  unit: UnitSystem;
  initialGoal: FitnessGoal | null;
  initialFatLossPace: FatLossPace | null;
  initialRecompPriority: RecompPriority | null;
  initialGoalWeightKg: number | null;
  initialCurrentWeightKg: number | null;
  initialSessionsPerWeek: number | null;
  initialMinutesPerSession: number | null;
  initialSportId?: string | null;
  initialSportPositionId?: string | null;
  initialSportSeasonPhase?: SportSeasonPhase | null;
  initialSportPracticeDays?: number[] | null;
  initialSportPracticeGymPolicy?: SportPracticeGymPolicy | null;
  initialSportPracticeScheduleVaries?: boolean;
  initialSecondaryGoal?: FitnessGoal | null;
  equipmentSettings: UserEquipmentSettings;
  oneRepMaxes: UserOneRepMaxRow[];
  oneRepMaxesTableReady: boolean;
  experienceLevel?: ExperienceLevel | null;
  weightLabel?: string;
  heightLabel?: string;
  spotifyMusic: SpotifyPublicStatus;
  spotifyStatus?: string | null;
  spotifyError?: string | null;
}

export function ProfileSettingsHub({
  userId,
  subscription,
  stripeConfigured,
  checkoutStatus,
  integrationsUnlocked,
  integrationsConfigured,
  providerConfigured,
  providerOAuthRedirectUris,
  initialIntegrations,
  integrationStatus,
  integrationError,
  gamificationUnlocked,
  gamificationOptIn,
  communityOptInVariant = "control",
  communityPush,
  communityEmail,
  weighInPush,
  unit,
  initialGoal,
  initialFatLossPace,
  initialRecompPriority,
  initialGoalWeightKg,
  initialCurrentWeightKg,
  initialSessionsPerWeek,
  initialMinutesPerSession,
  initialSportId,
  initialSportPositionId,
  initialSportSeasonPhase,
  initialSportPracticeDays,
  initialSportPracticeGymPolicy,
  initialSportPracticeScheduleVaries,
  initialSecondaryGoal,
  equipmentSettings,
  oneRepMaxes,
  oneRepMaxesTableReady,
  experienceLevel,
  weightLabel,
  heightLabel,
  spotifyMusic,
  spotifyStatus,
  spotifyError,
}: ProfileSettingsHubProps) {
  const subscriptionHint = hasProPlusAccess(subscription)
    ? "Pro+"
    : hasProAccess(subscription)
      ? "Pro"
      : "Free";

  const workoutMusicHint = !spotifyMusic.configured
    ? "Not configured"
    : spotifyMusic.connected
      ? "Spotify connected"
      : "Not connected";

  const programPlanHint = formatProgramPlanHint({
    goal: initialGoal,
    sessionsPerWeek: initialSessionsPerWeek,
    minutesPerSession: initialMinutesPerSession,
    sportId: initialSportId,
  });
  const equipmentHint = formatEquipmentHint(equipmentSettings);

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/evidence"
          className="rounded-xl border border-[var(--border)] bg-forge-surface-raised px-3 py-3 text-center text-sm font-semibold text-forge-text transition-colors hover:border-forge-ember/40"
        >
          Evidence
        </Link>
        <Link
          href="/exercises"
          className="rounded-xl border border-[var(--border)] bg-forge-surface-raised px-3 py-3 text-center text-sm font-semibold text-forge-text transition-colors hover:border-forge-ember/40"
        >
          Exercises
        </Link>
      </div>

      <CollapsibleSection
        title="Subscription"
        hint={subscriptionHint}
        id="subscription"
        defaultOpen={
          checkoutStatus === "success" || checkoutStatus === "canceled"
        }
      >
        <p className="mb-4 text-xs text-forge-muted">
          Long-horizon analytics with Pro. Device sync, eating-out quick-log, and
          Personalized coaching copy with Pro+.
        </p>
        <SubscriptionSetting
          subscription={subscription}
          stripeConfigured={stripeConfigured}
          checkoutStatus={checkoutStatus}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Workout music"
        hint={workoutMusicHint}
        id="workout-music"
        defaultOpen={spotifyStatus === "connected" || Boolean(spotifyError)}
      >
        <p className="mb-4 text-xs text-forge-muted">
          Connect Spotify for in-workout play/pause/skip controls. Vibe deep links
          on the Workout tab work without connecting.
        </p>
        <WorkoutMusicSetting
          initialStatus={spotifyMusic}
          spotifyStatus={spotifyStatus}
          spotifyError={spotifyError}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Integrations & gamification"
        hint="Devices & community"
        anchorIds={["integrations", "gamification"]}
      >
        <div className="space-y-4">
          <IntegrationsSetting
            unlocked={integrationsUnlocked}
            configured={integrationsConfigured}
            providerConfigured={providerConfigured}
            providerOAuthRedirectUris={providerOAuthRedirectUris}
            initialIntegrations={initialIntegrations}
            integrationStatus={integrationStatus}
            integrationError={integrationError}
          />
          <GamificationSetting
            unlocked={gamificationUnlocked}
            optedIn={gamificationOptIn}
            optInVariant={communityOptInVariant}
          />
          <CommunityPushSetting
            enabled={gamificationUnlocked && gamificationOptIn}
            push={communityPush}
          />
          <CommunityEmailSetting
            enabled={gamificationUnlocked && gamificationOptIn}
            email={communityEmail}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Program plan"
        hint={programPlanHint}
        id="program-plan"
      >
        <ProgramPlanSetting
          userId={userId}
          initialGoal={initialGoal}
          initialFatLossPace={initialFatLossPace}
          initialRecompPriority={initialRecompPriority}
          initialGoalWeightKg={initialGoalWeightKg}
          initialCurrentWeightKg={initialCurrentWeightKg}
          initialSessionsPerWeek={initialSessionsPerWeek}
          initialMinutesPerSession={initialMinutesPerSession}
          initialSportId={initialSportId}
          initialSportPositionId={initialSportPositionId}
          initialSportSeasonPhase={initialSportSeasonPhase}
          initialSportPracticeDays={initialSportPracticeDays}
          initialSportPracticeGymPolicy={initialSportPracticeGymPolicy}
          initialSportPracticeScheduleVaries={initialSportPracticeScheduleVaries}
          initialSecondaryGoal={initialSecondaryGoal}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Equipment"
        hint={equipmentHint}
        id="equipment"
      >
        <EquipmentSetting initialSettings={equipmentSettings} />
      </CollapsibleSection>

      <CollapsibleSection title="Training maxes" hint="1RM declarations">
        <OneRepMaxSetting
          initialMaxes={oneRepMaxes}
          tableReady={oneRepMaxesTableReady}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Preferences" hint="Units & body stats">
        <div className="space-y-4">
          {isWeighInReminderGoal(initialGoal) && (
            <WeighInPushSetting push={weighInPush} />
          )}
          <UnitPreferenceSetting initialUnit={unit} />
          <section className="space-y-3 rounded-xl border border-[var(--border)] bg-forge-surface p-4 text-sm">
            <Row label="Experience" value={experienceLevel} />
            <Row label="Weight" value={weightLabel} />
            <Row label="Height" value={heightLabel} />
          </section>
        </div>
      </CollapsibleSection>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-forge-muted">{label}</span>
      <span className="font-medium capitalize text-forge-text">
        {value ?? "—"}
      </span>
    </div>
  );
}
