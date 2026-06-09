import { BottomNav } from "@/components/layout/bottom-nav";
import { SyncManager } from "@/components/workout/sync-manager";
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

  return (
    <div className="min-h-dvh bg-forge-surface pb-[calc(5rem+env(safe-area-inset-bottom))]">
      {user && <SyncManager userId={user.id} />}
      {children}
      <BottomNav />
    </div>
  );
}
