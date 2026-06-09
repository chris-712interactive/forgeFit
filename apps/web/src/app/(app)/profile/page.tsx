import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { UnitPreferenceSetting } from "@/components/profile/unit-preference-setting";
import { createClient } from "@/lib/supabase/server";
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

  return (
    <div className="px-6 py-8">
      <h1 className="font-display text-2xl font-bold text-forge-text">Profile</h1>
      <p className="mt-2 text-forge-muted">{user?.email}</p>

      <Link
        href="/exercises"
        className="mt-6 block rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-5 text-sm transition-colors hover:border-forge-ember/40"
      >
        <p className="font-display font-semibold text-forge-text">Exercise library</p>
        <p className="mt-1 text-forge-muted">Demos, muscle maps, equipment swaps</p>
      </Link>

      <UnitPreferenceSetting initialUnit={unit} />

      <section className="mt-6 space-y-3 rounded-2xl bg-forge-surface-raised p-5 text-sm">
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

      <div className="mt-8">
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
