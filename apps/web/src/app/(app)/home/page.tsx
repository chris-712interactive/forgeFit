import { HomeDashboard } from "@/components/home/home-dashboard";
import { appHeaderGap, appPagePadding } from "@/components/layout/page-layout";
import { getMemberContext } from "@/lib/auth/member-context";
import { getHomeDashboardData } from "@/lib/home/service";

function formatHomeDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default async function HomePage() {
  const member = await getMemberContext();

  if (!member) {
    return (
      <div className="px-6 py-8">
        <p className="text-forge-muted">Sign in to view your dashboard.</p>
      </div>
    );
  }

  const data = await getHomeDashboardData(member.effectiveUserId);

  const greeting = data.displayName ? `Hey, ${data.displayName}` : "Let's forge it";

  return (
    <div className={appPagePadding}>
      <p className="text-sm text-forge-muted">{formatHomeDate(new Date())}</p>
      <h1 className="font-display mt-1 text-2xl font-bold text-forge-text sm:text-3xl">
        {greeting}
      </h1>

      <div className={appHeaderGap}>
        <HomeDashboard data={data} encouragement={data.encouragement} />
      </div>
    </div>
  );
}
