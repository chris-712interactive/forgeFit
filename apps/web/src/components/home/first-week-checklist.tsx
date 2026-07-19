"use client";

import { buildNutritionHref } from "@/lib/nutrition/date-param";
import type { HomeDashboardData } from "@/lib/home/types";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "forgefit:first-week-checklist-dismissed";

interface FirstWeekChecklistProps {
  data: HomeDashboardData;
}

export function FirstWeekChecklist({ data }: FirstWeekChecklistProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const workoutDone = data.weeklyStats.workoutsCompleted > 0;
  const foodDone = data.nutrition.entries.length > 0;
  const weighInDone =
    data.charts.weightByDay.filter((point) => point.weightKg != null).length >=
    2;

  const allDone = workoutDone && foodDone && weighInDone;
  // Only surface for early members — avoid nagging established users who skipped food today.
  const isEarlyMember =
    data.weeklyStats.workoutsCompleted === 0 || !weighInDone;

  const items = useMemo(
    () => [
      {
        id: "workout",
        label: "Complete your first workout",
        done: workoutDone,
        href:
          data.hero.sessionDayIndex != null
            ? `/workout?day=${data.hero.sessionDayIndex}`
            : "/workout",
      },
      {
        id: "food",
        label: "Log a meal",
        done: foodDone,
        href: buildNutritionHref({ tab: "diary" }),
      },
      {
        id: "weigh-in",
        label: "Log a second weigh-in",
        done: weighInDone,
        href: "/progress?tab=log#log-measurement",
      },
    ],
    [
      data.hero.sessionDayIndex,
      foodDone,
      weighInDone,
      workoutDone,
    ]
  );

  if (dismissed || allDone || !isEarlyMember) {
    return null;
  }

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  return (
    <section className="rounded-2xl border border-forge-ember/30 bg-forge-ember/5 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-forge-ember">
            First week
          </p>
          <h2 className="mt-1 font-display text-lg font-semibold text-forge-text">
            Three moves to unlock the loop
          </h2>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="text-xs font-medium text-forge-muted hover:text-forge-text"
        >
          Dismiss
        </button>
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={`flex min-h-[44px] items-center justify-between rounded-xl border px-3 py-2 text-sm ${
                item.done
                  ? "border-forge-success/30 bg-forge-success/5 text-forge-success"
                  : "border-[var(--border)] bg-forge-surface-raised text-forge-text hover:border-forge-ember/40"
              }`}
            >
              <span>
                {item.done ? "✓ " : ""}
                {item.label}
              </span>
              {!item.done && (
                <span className="text-xs font-semibold text-forge-ember">Go →</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
