import { BottomNav } from "@/components/layout/bottom-nav";
import { PrefetchAppShell } from "@/components/offline/prefetch-app-shell";
import { UnitPreferenceProvider } from "@/components/units/unit-preference-provider";
import { SyncManager } from "@/components/workout/sync-manager";
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

  return (
    <div className="min-h-dvh bg-forge-surface pb-[calc(5rem+env(safe-area-inset-bottom))]">
      {user ? (
        <UnitPreferenceProvider initialUnit={unitSystem}>
          <SyncManager userId={user.id}>
            <PrefetchAppShell />
            {children}
          </SyncManager>
        </UnitPreferenceProvider>
      ) : (
        children
      )}
      <BottomNav />
    </div>
  );
}
