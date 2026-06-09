import { WeekSchedule } from "@/components/program/week-schedule";
import { ensureActiveProgram } from "@/lib/programs/service";
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

  const plan = user ? await ensureActiveProgram(user.id) : null;

  const goalLabel = profile?.primary_goal
    ?.replace(/_/g, " ")
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  const todaySession = plan?.week[0];

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
        {plan && (
          <p className="mt-2 text-sm text-forge-steel">{plan.summary}</p>
        )}
      </section>

      {plan ? (
        <div className="mt-6">
          <WeekSchedule plan={plan} />
        </div>
      ) : (
        <p className="mt-6 text-sm text-forge-muted">
          Run the programs migration in Supabase, then refresh to generate your
          plan.
        </p>
      )}

      <Link
        href="/exercises"
        className="mt-6 block rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-5 transition-colors hover:border-forge-ember/40"
      >
        <p className="font-display font-bold text-forge-text">Exercise library</p>
        <p className="mt-1 text-sm text-forge-muted">
          800+ demos, muscle maps, and equipment swaps
        </p>
      </Link>

      {todaySession && (
        <Link
          href={`/workout?day=${todaySession.dayIndex}`}
          className="mt-4 flex min-h-[52px] w-full items-center justify-center rounded-xl bg-forge-ember font-display font-bold text-white"
        >
          Start {todaySession.name}
        </Link>
      )}
    </div>
  );
}
