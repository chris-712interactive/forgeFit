import Link from "next/link";
import { redirect } from "next/navigation";
import { getPostAuthPath } from "@/lib/auth/post-auth-path";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const destination = await getPostAuthPath(supabase, user.id);
    if (destination === "/home") {
      redirect("/home");
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-forge-surface text-forge-text">
      <header className="gradient-forge-ignite px-6 pb-12 pt-10">
        <img
          src="/logo.svg"
          alt="forgeFit"
          className="mb-4 h-auto w-full max-w-[280px]"
          width={280}
          height={109}
        />
        <p className="font-display text-sm font-semibold uppercase tracking-widest text-white/80">
          Your fitness journey starts here
        </p>
        <p className="mt-3 max-w-sm text-base text-white/90">
          Evidence-based workouts and nutrition — built for the gym, works offline
          when signal doesn&apos;t.
        </p>
      </header>

      <main className="flex flex-1 flex-col gap-6 px-6 py-8">
        <section className="rounded-2xl bg-forge-surface-raised p-5">
          <h2 className="font-display text-lg font-bold text-forge-gold">
            Your plan, built on evidence
          </h2>
          <p className="mt-2 text-sm text-forge-muted">
            Personalized workouts and nutrition targets from peer-reviewed rules —
            not guesswork.
          </p>
        </section>

        <section className="grid gap-3">
          {[
            { label: "Programs", desc: "Fat loss, strength, bodybuilding & more" },
            { label: "Track", desc: "Sets, reps, calories, measurements" },
            { label: "Offline", desc: "Log workouts with no Wi‑Fi" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-forge-surface-raised p-4"
            >
              <div className="h-10 w-1 rounded-full bg-forge-ember" />
              <div>
                <p className="font-display font-semibold">{item.label}</p>
                <p className="text-sm text-forge-muted">{item.desc}</p>
              </div>
            </div>
          ))}
        </section>

        <Link
          href="/signup"
          className="mt-auto flex min-h-[52px] w-full items-center justify-center rounded-xl bg-forge-ember font-display text-base font-bold text-white transition-colors hover:bg-forge-glow active:scale-[0.98]"
        >
          Get Started
        </Link>
        <Link
          href="/login"
          className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-[var(--border)] font-medium text-forge-text transition-colors hover:border-forge-muted"
        >
          Sign In
        </Link>
      </main>
    </div>
  );
}
