import { BottomNav } from "@/components/layout/bottom-nav";
import { ExperiencePathIndicator } from "@/components/progression/experience-path-indicator";
import { PrefetchAppShell } from "@/components/offline/prefetch-app-shell";
import { UnitPreferenceProvider } from "@/components/units/unit-preference-provider";
import { SyncManager } from "@/components/workout/sync-manager";
import { getUnreadCommunityNotificationCount } from "@/lib/coaching/community-social";
import { getPromotionEvaluationForUser } from "@/lib/progression/service";
import { getUserUnitSystem } from "@/lib/units/preference";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const unitSystem = user ? await getUserUnitSystem(user.id) : "metric";
  const promotion = user ? await getPromotionEvaluationForUser(user.id) : null;
  const unreadCommunityCount = user
    ? await getUnreadCommunityNotificationCount(user.id)
    : 0;

  return (
    <div className="min-h-dvh bg-forge-surface pb-[calc(5rem+env(safe-area-inset-bottom))]">
      {user ? (
        <UnitPreferenceProvider initialUnit={unitSystem}>
          <SyncManager userId={user.id}>
            <PrefetchAppShell />
            {children}
            <ExperiencePathIndicator evaluation={promotion} />
          </SyncManager>
        </UnitPreferenceProvider>
      ) : (
        children
      )}
      <BottomNav unreadCommunityCount={unreadCommunityCount} />
    </div>
  );
}
