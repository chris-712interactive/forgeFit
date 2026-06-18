import type { CommunityNotificationRow } from "@/lib/coaching/types";
import Link from "next/link";

interface HomeNotificationsStripProps {
  notifications: CommunityNotificationRow[];
  unreadCount: number;
}

export function HomeNotificationsStrip({
  notifications,
  unreadCount,
}: HomeNotificationsStripProps) {
  if (unreadCount === 0) {
    return null;
  }

  const latest = notifications.find((item) => !item.read) ?? notifications[0];
  if (!latest) {
    return null;
  }

  return (
    <Link
      href="/community"
      className="block rounded-xl border border-forge-ember/30 bg-forge-ember/5 px-4 py-3 transition-colors hover:bg-forge-ember/10"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-forge-ember">
        Community · {unreadCount} new
      </p>
      <p className="mt-1 text-sm font-medium text-forge-text">{latest.title}</p>
      <p className="mt-0.5 line-clamp-2 text-xs text-forge-muted">{latest.body}</p>
    </Link>
  );
}
