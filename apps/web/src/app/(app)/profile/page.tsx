import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  appHeaderGap,
  appPagePadding,
  appSectionStack,
} from "@/components/layout/page-layout";
import { LegalFooter } from "@/components/legal/legal-document";
import { EquipmentSetting } from "@/components/profile/equipment-setting";
import { ProgramPlanSetting } from "@/components/profile/program-plan-setting";
import { OneRepMaxSetting } from "@/components/profile/one-rep-max-setting";
import { PrivacyDataSetting } from "@/components/profile/privacy-data-setting";
import { UnitPreferenceSetting } from "@/components/profile/unit-preference-setting";
import { getUserEquipmentSettings } from "@/lib/equipment/service";
import { getUserOneRepMaxes } from "@/lib/progression/user-maxes";
import { ExperiencePromotionBanner } from "@/components/progression/experience-promotion-banner";
import { TrainingConsistencyCard } from "@/components/progression/training-consistency-card";
import { getPromotionEvaluation } from "@/lib/progression/service";
import { SubscriptionSetting } from "@/components/profile/subscription-setting";
import { IntegrationsSetting } from "@/components/profile/integrations-setting";
import { getSubscriptionForUser } from "@/lib/billing/subscription";
import { hasFeature } from "@/lib/billing/gates";
import { isStripeProConfigured } from "@/lib/billing/stripe";
import {
  buildIntegrationsHubView,
  listIntegrationStatuses,
} from "@/lib/integrations/service";
import {
  isDeviceIntegrationsConfigured,
  isFitbitIntegrationConfigured,
  isWithingsConfigured,
} from "@/lib/integrations/config";
import { hasProAccess } from "@/lib/billing/types";
import { getActiveProgram } from "@/lib/programs/service";
import { createClient } from "@/lib/supabase/server";
import { getServerSessionRecords } from "@/lib/workouts/sessions-server";
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

  const [plan, sessionResult, oneRepMaxes, equipmentSettings, subscription] = user
    ? await Promise.all([
        getActiveProgram(user.id),
        getServerSessionRecords(user.id, 120),
        getUserOneRepMaxes(user.id),
        getUserEquipmentSettings(user.id),
        getSubscriptionForUser(user.id),
      ])
    : [
        null,
        { records: [], tableReady: true },
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
      ];

  const promotion = user
    ? await getPromotionEvaluation(user.id, sessionResult.records, plan)
    : null;

  const integrationsUnlocked = hasFeature(subscription, "device_integrations");
  let initialIntegrations = buildIntegrationsHubView([]);
  if (user && integrationsUnlocked) {
    try {
      const statuses = await listIntegrationStatuses(user.id);
      initialIntegrations = buildIntegrationsHubView(statuses);
    } catch {
      initialIntegrations = buildIntegrationsHubView([]);
    }
  }

  return (
    <div className={appPagePadding}>
      <h1 className="font-display text-2xl font-bold text-forge-text">Profile</h1>
      <p className="mt-2 text-forge-muted">{user?.email}</p>

      <div className={`${appHeaderGap} ${appSectionStack}`}>
        <Link
          href="/evidence"
          className="block rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-5 text-sm transition-colors hover:border-forge-ember/40"
        >
          <p className="font-display font-semibold text-forge-text">
            Evidence behind your plan
          </p>
          <p className="mt-1 text-forge-muted">
            Rules, recommendations, and cited sources that power your program
          </p>
        </Link>

        <Link
          href="/exercises"
          className="block rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-5 text-sm transition-colors hover:border-forge-ember/40"
        >
          <p className="font-display font-semibold text-forge-text">
            Exercise library
          </p>
          <p className="mt-1 text-forge-muted">
            Demos, muscle maps, equipment swaps
          </p>
        </Link>

        <SubscriptionSetting
          subscription={subscription}
          stripeConfigured={isStripeProConfigured()}
          checkoutStatus={checkoutStatus}
        />

        <IntegrationsSetting
          unlocked={integrationsUnlocked}
          configured={isDeviceIntegrationsConfigured()}
          providerConfigured={{
            withings: isWithingsConfigured(),
            fitbit: isFitbitIntegrationConfigured(),
          }}
          initialIntegrations={initialIntegrations}
          integrationStatus={integrationStatus}
          integrationError={integrationError}
        />

        <UnitPreferenceSetting initialUnit={unit} />

        <ProgramPlanSetting
          initialGoal={profile?.primary_goal ?? null}
          initialSessionsPerWeek={profile?.sessions_per_week ?? null}
          initialMinutesPerSession={profile?.minutes_per_session ?? null}
        />

        <EquipmentSetting initialSettings={equipmentSettings} />

        <OneRepMaxSetting
          initialMaxes={oneRepMaxes.rows}
          tableReady={oneRepMaxes.tableReady}
        />

        {promotion?.showNudge && (
          <ExperiencePromotionBanner evaluation={promotion} />
        )}

        {promotion && !promotion.showNudge && (
          <TrainingConsistencyCard evaluation={promotion} />
        )}

        <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-5 text-sm">
          <Row label="Experience" value={profile?.experience_level} />
          <Row
            label="Weight"
            value={
              profile?.weight_kg
                ? formatWeight(Number(profile.weight_kg), unit)
                : undefined
            }
          />
          <Row
            label="Height"
            value={
              profile?.height_cm
                ? formatHeight(Number(profile.height_cm), unit)
                : undefined
            }
          />
        </section>

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
