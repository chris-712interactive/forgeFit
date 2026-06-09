import { ProgressDashboard } from "@/components/progress/progress-dashboard";
import { getProgressDashboardData } from "@/lib/measurements/service";
import { createClient } from "@/lib/supabase/server";

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const data = user ? await getProgressDashboardData(user.id) : null;

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="font-display text-2xl font-bold text-forge-text">
        Progress
      </h1>
      <p className="mt-2 text-forge-muted">
        Track measurements, estimate body fat with calipers, and preview your
        30-day weight trend.
      </p>

      {data ? (
        <ProgressDashboard data={data} />
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] p-8 text-center">
          <p className="text-forge-muted">Sign in to view your progress.</p>
        </div>
      )}
    </div>
  );
}
