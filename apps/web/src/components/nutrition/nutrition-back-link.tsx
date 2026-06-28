import Link from "next/link";

export function NutritionBackLink() {
  return (
    <Link
      href="/nutrition"
      className="inline-flex min-h-[44px] items-center text-sm font-semibold text-forge-ember hover:text-forge-ember/80"
    >
      ← Nutrition
    </Link>
  );
}
