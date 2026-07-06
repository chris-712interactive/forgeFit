import { AdminRevenueDashboard } from "@/components/admin/admin-revenue-dashboard";
import { getAdminRevenueMetrics } from "@/lib/admin/revenue-metrics";

export default async function AdminRevenuePage() {
  const metrics = await getAdminRevenueMetrics();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-forge-text sm:text-3xl">
          Revenue
        </h1>
        <p className="mt-1 text-sm text-forge-muted">
          ARR, MRR, churn, and tier mix from Stripe + profile comps (cached 15
          min).
        </p>
      </header>

      <AdminRevenueDashboard metrics={metrics} />
    </div>
  );
}
