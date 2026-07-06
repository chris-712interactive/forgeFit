import Link from "next/link";
import { AdminIngredientSuggestionsTable } from "@/components/admin/admin-ingredient-suggestions-table";
import { listIngredientSuggestions } from "@/lib/admin/ingredient-suggestions";

interface AdminIngredientsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminIngredientsPage({
  searchParams,
}: AdminIngredientsPageProps) {
  const params = await searchParams;
  const statusParam = params.status ?? "pending";
  const status =
    statusParam === "all" ||
    statusParam === "pending" ||
    statusParam === "reviewed" ||
    statusParam === "added" ||
    statusParam === "rejected"
      ? statusParam
      : "pending";

  const suggestions = await listIngredientSuggestions({ status, limit: 100 });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-forge-text sm:text-3xl">
          Ingredient suggestions
        </h1>
        <p className="mt-1 text-sm text-forge-muted">
          Review user-submitted whole-food suggestions from meal builder.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {(["pending", "reviewed", "added", "rejected", "all"] as const).map(
          (value) => (
            <Link
              key={value}
              href={
                value === "pending"
                  ? "/admin/ingredients"
                  : `/admin/ingredients?status=${value}`
              }
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize ${
                status === value
                  ? "bg-forge-ember/15 text-forge-text ring-1 ring-inset ring-forge-ember/30"
                  : "border border-white/10 text-forge-muted hover:bg-white/5"
              }`}
            >
              {value}
            </Link>
          )
        )}
      </div>

      <AdminIngredientSuggestionsTable suggestions={suggestions} />
    </div>
  );
}
