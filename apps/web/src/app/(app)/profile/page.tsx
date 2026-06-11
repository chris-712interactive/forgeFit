import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  appHeaderGap,
  appPagePadding,
  appSectionStack,
} from "@/components/layout/page-layout";
import { EquipmentSetting } from "@/components/profile/equipment-setting";
import { OneRepMaxSetting } from "@/components/profile/one-rep-max-setting";
import { PrivacyDataSetting } from "@/components/profile/privacy-data-setting";
import { UnitPreferenceSetting } from "@/components/profile/unit-preference-setting";
import { getUserEquipmentSettings } from "@/lib/equipment/service";
import { getUserOneRepMaxes } from "@/lib/progression/user-maxes";
import { ExperiencePromotionBanner } from "@/components/progression/experience-promotion-banner";
import { TrainingConsistencyCard } from "@/components/progression/training-consistency-card";
import { getPromotionEvaluation } from "@/lib/progression/service";
import { getActiveProgram } from "@/lib/programs/service";
import { createClient } from "@/lib/supabase/server";
import { getServerSessionRecords } from "@/lib/workouts/sessions-server";
import {
  formatHeight,
  formatWeight,
  normalizeUnitSystem,
} from "@/lib/units/measurements";

export default async function ProfilePage() {
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

  const [plan, sessionResult, oneRepMaxes, equipmentSettings] = user
    ? await Promise.all([
        getActiveProgram(user.id),
        getServerSessionRecords(user.id, 120),
        getUserOneRepMaxes(user.id),
        getUserEquipmentSettings(user.id),
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
      ];

  const promotion = user
    ? await getPromotionEvaluation(user.id, sessionResult.records, plan)
    : null;

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

        <UnitPreferenceSetting initialUnit={unit} />

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
          <Row label="Goal" value={profile?.primary_goal?.replace(/_/g, " ")} />
          <Row label="Experience" value={profile?.experience_level} />
          <Row
            label="Schedule"
            value={
              profile?.sessions_per_week
                ? `${profile.sessions_per_week}×${profile.minutes_per_session} min`
                : undefined
            }
          />
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

        {user?.email && (
          <PrivacyDataSetting email={user.email} userId={user.id} />
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
