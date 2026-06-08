import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("primary_goal, experience_level, sessions_per_week, minutes_per_session, why_started")
        .eq("id", user.id)
        .single()
    : { data: null };

  const goalLabel = profile?.primary_goal
    ?.replace(/_/g, " ")
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  return (
    <div className="px-6 py-8">
      <p className="font-display text-sm font-semibold uppercase tracking-widest text-forge-gold">
        You&apos;re in
      </p>
      <h1 className="font-display mt-1 text-3xl font-bold text-forge-text">
        Let&apos;s forge it
      </h1>

      {profile?.why_started && (
        <div className="gradient-forge-ignite mt-6 rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
            Why you started
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white">
            {profile.why_started}
          </p>
        </div>
      )}

      <section className="mt-6 rounded-2xl bg-forge-surface-raised p-5">
        <h2 className="font-display font-bold text-forge-text">Your plan</h2>
        <p className="mt-2 text-sm text-forge-muted">
          {goalLabel ?? "Custom"} · {profile?.experience_level ?? "—"} ·{" "}
          {profile?.sessions_per_week ?? "—"}×{profile?.minutes_per_session ?? "—"}{" "}
          min/week
        </p>
        <p className="mt-3 text-sm text-forge-muted">
          Your personalized program arrives in Phase 2. For now, explore the app
          shell below.
        </p>
      </section>

      <Link
        href="/workout"
        className="mt-6 flex min-h-[52px] w-full items-center justify-center rounded-xl bg-forge-ember font-display font-bold text-white"
      >
        Start Workout
      </Link>
    </div>
  );
}
