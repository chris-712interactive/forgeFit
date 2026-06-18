import { appPagePadding } from "@/components/layout/page-layout";

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-forge-surface-raised ${className}`}
      aria-hidden
    />
  );
}

export default function AppLoading() {
  return (
    <div className={appPagePadding} aria-busy="true" aria-label="Loading page">
      <SkeletonBlock className="h-4 w-16" />
      <SkeletonBlock className="mt-3 h-8 w-48" />
      <div className="mt-6 space-y-4">
        <SkeletonBlock className="h-28 w-full" />
        <SkeletonBlock className="h-40 w-full" />
        <SkeletonBlock className="h-32 w-full" />
      </div>
    </div>
  );
}
