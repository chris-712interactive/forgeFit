import { AdminGrowthDashboard } from "@/components/admin/admin-growth-dashboard";
import { getAdminGrowthMetrics } from "@/lib/admin/growth-metrics";

export default async function AdminGrowthPage() {
  const metrics = await getAdminGrowthMetrics();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-forge-text sm:text-3xl">
          Growth
        </h1>
        <p className="mt-1 text-sm text-forge-muted">
          Activation funnel, signup sources, and workout retention (cached 15
          min).
        </p>
      </header>

      <AdminGrowthDashboard metrics={metrics} />
    </div>
  );
}
