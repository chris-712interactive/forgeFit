import { TimezoneSync } from "@/components/datetime/timezone-sync";
import { ImpersonationBanner } from "@/components/auth/impersonation-banner";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ExperiencePathIndicator } from "@/components/progression/experience-path-indicator";
import { PrefetchAppShell } from "@/components/offline/prefetch-app-shell";
import { UnitPreferenceProvider } from "@/components/units/unit-preference-provider";
import { SyncManager } from "@/components/workout/sync-manager";
import { getUnreadCommunityNotificationCount } from "@/lib/coaching/community-social";
import { getMemberContext } from "@/lib/auth/member-context";
import { getPromotionEvaluationForUser } from "@/lib/progression/service";
import { getUserUnitSystem } from "@/lib/units/preference";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const member = await getMemberContext();

  const effectiveUserId = member?.effectiveUserId ?? null;
  const unitSystem = effectiveUserId
    ? await getUserUnitSystem(effectiveUserId)
    : "metric";
  const promotion = effectiveUserId
    ? await getPromotionEvaluationForUser(effectiveUserId)
    : null;
  const unreadCommunityCount = effectiveUserId
    ? await getUnreadCommunityNotificationCount(effectiveUserId)
    : 0;

  return (
    <div className="min-h-dvh bg-forge-surface pb-[calc(5rem+env(safe-area-inset-bottom))]">
      {member?.isImpersonating ? (
        <ImpersonationBanner email={member.impersonatedEmail} />
      ) : null}
      <TimezoneSync />
      {member && effectiveUserId && !member.isImpersonating ? (
        <UnitPreferenceProvider initialUnit={unitSystem}>
          <SyncManager userId={effectiveUserId}>
            <PrefetchAppShell />
            {children}
            <ExperiencePathIndicator evaluation={promotion} />
          </SyncManager>
        </UnitPreferenceProvider>
      ) : member && effectiveUserId ? (
        <UnitPreferenceProvider initialUnit={unitSystem}>
          {children}
          <ExperiencePathIndicator evaluation={promotion} />
        </UnitPreferenceProvider>
      ) : (
        children
      )}
      <BottomNav unreadCommunityCount={unreadCommunityCount} />
    </div>
  );
}
