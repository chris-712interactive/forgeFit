import { BottomNav } from "@/components/layout/bottom-nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-forge-surface pb-[calc(5rem+env(safe-area-inset-bottom))]">
      {children}
      <BottomNav />
    </div>
  );
}
