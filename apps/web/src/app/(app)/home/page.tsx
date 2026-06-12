import { HomeDashboard } from "@/components/home/home-dashboard";
import {
  appHeaderGap,
  appPagePadding,
} from "@/components/layout/page-layout";
import { getHomeDashboardData } from "@/lib/home/service";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="px-6 py-8">
        <p className="text-forge-muted">Sign in to view your dashboard.</p>
      </div>
    );
  }

  const data = await getHomeDashboardData(user.id);

  const greeting = data.displayName
    ? `Hey, ${data.displayName}`
    : "Let's forge it";

  return (
    <div className={appPagePadding}>
      <p className="font-display text-sm font-semibold uppercase tracking-widest text-forge-gold">
        Home
      </p>
      <h1 className="font-display mt-1 text-2xl font-bold text-forge-text sm:text-3xl">
        {greeting}
      </h1>

      <div className={appHeaderGap}>
        <HomeDashboard data={data} encouragement={data.encouragement} />
      </div>
    </div>
  );
}
