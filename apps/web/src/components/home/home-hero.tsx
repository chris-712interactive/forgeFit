"use client";

import { buildNutritionHref } from "@/lib/nutrition/date-param";
import type { HomeHeroContext } from "@/lib/home/hero-context";
import type { WeeklyWorkStats } from "@/lib/home/types";
import Link from "next/link";

interface HomeHeroProps {
  hero: HomeHeroContext;
  weeklyStats: WeeklyWorkStats;
  encouragement: string;
  birthdayMessage: string | null;
}

export function HomeHero({
  hero,
  weeklyStats,
  encouragement,
  birthdayMessage,
}: HomeHeroProps) {
  const hint = hero.fuelHint ?? encouragement;

  if (hero.status === "no_plan") {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-5">
        <p className="text-sm leading-relaxed text-forge-muted">
          Generate your program to unlock weekly tracking and your training plan.
        </p>
        <Link
          href="/workout"
          className="mt-4 flex min-h-[48px] items-center justify-center rounded-xl bg-forge-ember font-display text-sm font-bold text-white"
        >
          Set up your program
        </Link>
      </section>
    );
  }

  if (hero.status === "week_complete") {
    return (
      <section className="rounded-2xl border border-forge-success/30 bg-forge-success/5 p-5">
        <p className="font-display text-sm font-semibold uppercase tracking-wider text-forge-success">
          Week complete
        </p>
        <p className="mt-2 font-display text-xl font-bold text-forge-text">
          All planned workouts done
        </p>
        {hint && (
          <p className="mt-2 text-sm italic leading-relaxed text-forge-muted">{hint}</p>
        )}
        <Link
          href="/workout"
          className="mt-4 inline-flex text-sm font-semibold text-forge-steel hover:text-forge-ember"
        >
          View week plan →
        </Link>
      </section>
    );
  }

  const sessionName = hero.sessionName ?? "Workout";
  const detailParts = [
    hero.estimatedMinutes != null ? `~${hero.estimatedMinutes} min` : null,
    hero.exerciseCount != null
      ? `${hero.exerciseCount} exercise${hero.exerciseCount === 1 ? "" : "s"}`
      : null,
  ].filter(Boolean);

  const ctaLabel =
    hero.status === "in_progress"
      ? `Continue ${sessionName}`
      : hero.status === "rest"
        ? `Start ${sessionName}`
        : `Start ${sessionName}`;

  const statusLabel =
    hero.status === "in_progress"
      ? "In progress"
      : hero.status === "rest"
        ? "Up next"
        : "Today";

  const progressLine =
    hero.status === "in_progress" &&
    hero.setsCompleted != null &&
    hero.setsTotal != null
      ? `${hero.setsCompleted}/${hero.setsTotal} sets logged`
      : `${weeklyStats.workoutsCompleted} of ${weeklyStats.workoutsPlanned || "—"} workouts this week`;

  const workoutHref =
    hero.sessionDayIndex != null
      ? `/workout?day=${hero.sessionDayIndex}`
      : "/workout";

  return (
    <section className="rounded-2xl border border-forge-ember/25 bg-forge-ember/5 p-5">
      {birthdayMessage ? (
        <p className="mb-3 text-sm font-medium text-forge-gold">{birthdayMessage}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-forge-gold/40 bg-forge-gold/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-forge-gold">
          {statusLabel}
        </span>
        <span className="text-xs text-forge-muted">{progressLine}</span>
      </div>

      <h2 className="font-display mt-3 text-[22px] font-bold leading-tight text-forge-text">
        {sessionName}
      </h2>

      {detailParts.length > 0 && (
        <p className="mt-1.5 text-sm text-forge-muted">{detailParts.join(" · ")}</p>
      )}

      {hint && (
        <p className="mt-2 text-sm italic leading-relaxed text-forge-muted">{hint}</p>
      )}

      {hero.status !== "rest" || hero.sessionDayIndex != null ? (
        <Link
          href={workoutHref}
          className="mt-4 flex min-h-[52px] items-center justify-center rounded-xl bg-forge-ember font-display text-sm font-bold text-white"
        >
          {ctaLabel}
        </Link>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-semibold">
        <Link href={buildNutritionHref({ tab: "diary" })} className="text-forge-steel hover:text-forge-ember">
          Log food
        </Link>
        <span className="text-forge-muted" aria-hidden>
          ·
        </span>
        <Link href="/workout" className="text-forge-steel hover:text-forge-ember">
          View week plan
        </Link>
      </div>
    </section>
  );
}
