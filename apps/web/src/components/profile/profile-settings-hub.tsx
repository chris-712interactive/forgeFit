"use client";

import Link from "next/link";
import { CollapsibleSection } from "@/components/layout/collapsible-section";
import { CommunityEmailSetting } from "@/components/profile/community-email-setting";
import { CommunityPushSetting } from "@/components/profile/community-push-setting";
import type { CommunityEmailSettings } from "@/lib/coaching/community-email";
import type { CommunityPushSettings } from "@/lib/coaching/community-push";
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
import type { UserEquipmentSettings } from "@/lib/equipment/service";
import type { IntegrationPublicStatus } from "@/lib/integrations/types";
import type { UserOneRepMaxRow } from "@/lib/progression/user-maxes";
import type {
  ExperienceLevel,
  FitnessGoal,
  UnitSystem,
} from "@/lib/types/profile";
import type { IntegrationProvider } from "@forgefit/integrations";

type HubIntegration = IntegrationPublicStatus & {
  label: string;
  description: string;
  available: boolean;
};

interface ProfileSettingsHubProps {
  subscription: SubscriptionSnapshot;
  stripeConfigured: boolean;
  checkoutStatus: "success" | "canceled" | null;
  integrationsUnlocked: boolean;
  integrationsConfigured: boolean;
  providerConfigured: Partial<Record<IntegrationProvider, boolean>>;
  initialIntegrations: HubIntegration[];
  integrationStatus: string | null;
  integrationError: string | null;
  gamificationUnlocked: boolean;
  gamificationOptIn: boolean;
  communityOptInVariant?: import("@/lib/coaching/types").CommunityOptInVariant;
  communityPush: CommunityPushSettings;
  communityEmail: CommunityEmailSettings;
  unit: UnitSystem;
  initialGoal: FitnessGoal | null;
  initialSessionsPerWeek: number | null;
  initialMinutesPerSession: number | null;
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
  subscription,
  stripeConfigured,
  checkoutStatus,
  integrationsUnlocked,
  integrationsConfigured,
  providerConfigured,
  initialIntegrations,
  integrationStatus,
  integrationError,
  gamificationUnlocked,
  gamificationOptIn,
  communityOptInVariant = "control",
  communityPush,
  communityEmail,
  unit,
  initialGoal,
  initialSessionsPerWeek,
  initialMinutesPerSession,
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

      <SubscriptionSetting
        subscription={subscription}
        stripeConfigured={stripeConfigured}
        checkoutStatus={checkoutStatus}
      />

      <WorkoutMusicSetting
        initialStatus={spotifyMusic}
        spotifyStatus={spotifyStatus}
        spotifyError={spotifyError}
      />

      <CollapsibleSection
        title="Integrations & gamification"
        hint="Devices & community"
      >
        <div className="space-y-4">
          <IntegrationsSetting
            unlocked={integrationsUnlocked}
            configured={integrationsConfigured}
            providerConfigured={providerConfigured}
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

      <CollapsibleSection title="Program & equipment" hint="Goal, schedule, gear">
        <div className="space-y-4">
          <ProgramPlanSetting
            initialGoal={initialGoal}
            initialSessionsPerWeek={initialSessionsPerWeek}
            initialMinutesPerSession={initialMinutesPerSession}
          />
          <EquipmentSetting initialSettings={equipmentSettings} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Training maxes" hint="1RM declarations">
        <OneRepMaxSetting
          initialMaxes={oneRepMaxes}
          tableReady={oneRepMaxesTableReady}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Preferences" hint="Units & body stats">
        <div className="space-y-4">
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
