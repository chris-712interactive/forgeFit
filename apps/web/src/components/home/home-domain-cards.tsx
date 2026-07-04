"use client";

import { HomeDomainCard } from "@/components/home/home-domain-card";
import {
  MacroUsageBars,
  MiniSessionsChart,
  MiniStepsChart,
  MiniWeightChart,
} from "@/components/home/home-mini-charts";
import { useUnitPreference } from "@/components/units/unit-preference-provider";
import type { HomeDashboardData } from "@/lib/home/types";
import { buildNutritionHref } from "@/lib/nutrition/date-param";
import { formatSleepHours } from "@/lib/sleep/format";
import { formatKgToLbs, formatWeight } from "@/lib/units/measurements";

interface HomeDomainCardsProps {
  data: HomeDashboardData;
}

export function HomeDomainCards({ data }: HomeDomainCardsProps) {
  const unit = useUnitPreference();
  const { weeklyStats, nutrition, charts, activity, sleep, gamification } = data;

  const proteinLogged = Math.round(nutrition.totals.proteinG);
  const proteinTarget = nutrition.targets?.proteinG ?? 0;
  const proteinLeft =
    proteinTarget > 0 ? Math.max(0, Math.round(proteinTarget - proteinLogged)) : 0;

  const latestWeight = [...charts.weightByDay]
    .reverse()
    .find((point) => point.weightKg != null)?.weightKg;
  const weightHeadline =
    latestWeight != null ? formatWeight(latestWeight, unit) : "—";
  const weightDelta = charts.weightDeltaKg;
  const weightSubline =
    weightDelta != null
      ? `${weightDelta > 0 ? "+" : ""}${
          unit === "imperial"
            ? `${formatKgToLbs(weightDelta)} lbs`
            : `${weightDelta.toFixed(1)} kg`
        } over 7 days`
      : "Log measurements to track your trend";

  const stepsToday = activity.today?.steps;
  const stepsHeadline =
    stepsToday != null ? stepsToday.toLocaleString() : "—";
  const sleepLabel = formatSleepHours(sleep.lastNight?.durationMinutes);
  const activitySubline =
    activity.hasActivityData || activity.fitbitConnected
      ? `Steps today · ${sleepLabel} sleep last night`
      : "Connect Fitbit in Profile to import activity";

  const communityHeadline =
    gamification.unreadNotificationCount > 0
      ? `${gamification.unreadNotificationCount} new`
      : gamification.userRank != null
        ? `#${gamification.userRank}`
        : "Join";

  const communitySubline = gamification.unlocked
    ? gamification.bucketLabel
      ? `${gamification.bucketLabel}${gamification.unreadNotificationCount > 0 ? " · tap to catch up" : ""}`
      : "Complete onboarding to enter your league bucket"
    : "Pro community — leaderboards and weekly rivals";

  const habitScore =
    gamification.userScore != null ? Math.round(gamification.userScore) : null;

  return (
    <>
      <div className="w-[82%] max-w-[320px] shrink-0 snap-center">
        <HomeDomainCard
        title="Training"
        titleClassName="text-forge-gold"
        href="/workout"
        linkLabel="Workout →"
        headline={`${weeklyStats.workoutsCompleted} / ${weeklyStats.workoutsPlanned || "—"}`}
        subline={
          data.hero.sessionName
            ? `${data.hero.sessionName} is next`
            : "Workouts done this week"
        }
        chart={<MiniSessionsChart points={charts.sessionsByDay} />}
        chartCaption="Sessions completed per day · last 7 days"
        />
      </div>

      <div className="w-[82%] max-w-[320px] shrink-0 snap-center">
        <HomeDomainCard
        title="Nutrition"
        titleClassName="text-forge-coral"
        href={buildNutritionHref({ tab: "diary" })}
        linkLabel="Diary →"
        headline={`${proteinLogged}g`}
        subline={
          proteinLeft > 0
            ? `Protein logged · ${proteinLeft}g left today`
            : "Protein target hit for today"
        }
        chart={
          <MacroUsageBars
            proteinLogged={proteinLogged}
            proteinTarget={proteinTarget}
            caloriesLogged={nutrition.totals.calories}
            calorieTarget={nutrition.targets?.calories ?? 0}
          />
        }
        chartCaption="Macro progress vs daily targets"
        />
      </div>

      <div className="w-[82%] max-w-[320px] shrink-0 snap-center">
        <HomeDomainCard
        title="Progress"
        titleClassName="text-forge-steel"
        href="/progress"
        linkLabel="Trends →"
        headline={weightHeadline}
        subline={weightSubline}
        chart={<MiniWeightChart points={charts.weightByDay} />}
        chartCaption="Body weight trend · last 7 days"
        />
      </div>

      <div className="w-[82%] max-w-[320px] shrink-0 snap-center">
        <HomeDomainCard
        title="Activity"
        titleClassName="text-forge-steel"
        href="/progress#activity"
        linkLabel="Progress →"
        headline={stepsHeadline}
        subline={activitySubline}
        chart={<MiniStepsChart points={charts.stepsByDay} />}
        chartCaption="Daily steps · last 7 days (thousands in chart)"
        />
      </div>

      <div className="w-[82%] max-w-[320px] shrink-0 snap-center">
        <HomeDomainCard
        title="Community"
        titleClassName="text-forge-ember"
        href="/community"
        linkLabel="Community →"
        headline={communityHeadline}
        subline={communitySubline}
        chart={
          <CommunityStats
            rank={gamification.userRank}
            habitScore={habitScore}
            unlocked={gamification.unlocked && gamification.optedIn}
          />
        }
        chartCaption="League standing and habit score this week"
        />
      </div>
    </>
  );
}

function CommunityStats({
  rank,
  habitScore,
  unlocked,
}: {
  rank: number | null;
  habitScore: number | null;
  unlocked: boolean;
}) {
  if (!unlocked) {
    return (
      <div className="flex h-[88px] items-center justify-center rounded-xl border border-dashed border-[var(--border)] px-3 text-center text-xs text-forge-muted">
        Opt in on Community to see your rank
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-xl border border-[var(--border)] bg-forge-surface px-2 py-3 text-center">
        <p className="text-[10px] uppercase tracking-wide text-forge-muted">League rank</p>
        <p className="font-display mt-1 text-2xl font-bold tabular-nums text-forge-gold">
          {rank != null ? `#${rank}` : "—"}
        </p>
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-forge-surface px-2 py-3 text-center">
        <p className="text-[10px] uppercase tracking-wide text-forge-muted">Habit score</p>
        <p className="font-display mt-1 text-2xl font-bold tabular-nums text-forge-success">
          {habitScore ?? "—"}
        </p>
      </div>
    </div>
  );
}
