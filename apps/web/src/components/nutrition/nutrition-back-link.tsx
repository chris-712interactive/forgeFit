"use client";

import { useNutritionBackHref } from "@/components/nutrition/nutrition-date-picker";
import Link from "next/link";

interface NutritionBackLinkProps {
  todayIso: string;
}

export function NutritionBackLink({ todayIso }: NutritionBackLinkProps) {
  const href = useNutritionBackHref(todayIso);

  return (
    <Link
      href={href}
      className="inline-flex min-h-[44px] items-center text-sm font-semibold text-forge-ember hover:text-forge-ember/80"
    >
      ← Nutrition
    </Link>
  );
}
