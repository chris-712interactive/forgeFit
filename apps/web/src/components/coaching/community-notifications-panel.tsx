"use client";

import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/actions/community";
import type { CommunityNotificationRow } from "@/lib/coaching/types";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

interface CommunityNotificationsPanelProps {
  notifications: CommunityNotificationRow[];
  unreadCount: number;
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CommunityNotificationsPanel({
  notifications,
  unreadCount,
}: CommunityNotificationsPanelProps) {
  const router = useRouter();
  const [savingAll, setSavingAll] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [readOverrides, setReadOverrides] = useState<Set<string>>(
    () => new Set()
  );
  const [error, setError] = useState<string | null>(null);

  const effectiveUnreadCount = useMemo(() => {
    const markedLocally = notifications.filter(
      (item) => !item.read && readOverrides.has(item.id)
    ).length;
    return Math.max(0, unreadCount - markedLocally);
  }, [notifications, readOverrides, unreadCount]);

  function isRead(notification: CommunityNotificationRow): boolean {
    return notification.read || readOverrides.has(notification.id);
  }

  async function handleMarkAll() {
    setSavingAll(true);
    setError(null);
    const result = await markAllNotificationsRead();
    setSavingAll(false);

    if (!result.ok) {
      setError("Could not mark all notifications read.");
      return;
    }

    setReadOverrides(new Set(notifications.map((item) => item.id)));
    router.refresh();
  }

  async function handleMarkOne(id: string) {
    if (markingId) return;

    setMarkingId(id);
    setError(null);
    setReadOverrides((prev) => new Set(prev).add(id));

    const result = await markNotificationRead(id);
    setMarkingId(null);

    if (!result.ok) {
      setReadOverrides((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setError(result.error ?? "Could not mark notification read.");
      return;
    }

    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
            Notifications
          </h2>
          <p className="mt-1 text-xs text-forge-muted">
            Rank changes, rivals, and cheers
          </p>
        </div>
        {effectiveUnreadCount > 0 && (
          <button
            type="button"
            onClick={() => void handleMarkAll()}
            disabled={savingAll || markingId != null}
            className="text-xs font-medium text-forge-ember underline-offset-2 hover:underline disabled:opacity-60"
          >
            Mark all read
          </button>
        )}
      </div>

      {error && (
        <p className="mt-3 text-xs text-forge-coral">{error}</p>
      )}

      {notifications.length === 0 ? (
        <p className="mt-4 text-sm text-forge-muted">
          No notifications yet. When someone passes you on the board or your
          rival pulls ahead, it will show up here.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {notifications.map((notification) => {
            const read = isRead(notification);
            return (
              <li
                key={notification.id}
                className={`rounded-xl border px-3 py-3 ${
                  read
                    ? "border-[var(--border)] bg-forge-surface/60"
                    : "border-forge-ember/30 bg-forge-ember/5"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-forge-text">
                      {notification.title}
                    </p>
                    <p className="mt-1 text-sm text-forge-muted">
                      {notification.body}
                    </p>
                    <p className="mt-2 text-[11px] uppercase tracking-wide text-forge-muted">
                      {formatWhen(notification.createdAt)}
                    </p>
                  </div>
                  {!read && (
                    <button
                      type="button"
                      onClick={() => void handleMarkOne(notification.id)}
                      disabled={savingAll || markingId === notification.id}
                      className="shrink-0 text-[11px] font-medium text-forge-ember disabled:opacity-60"
                    >
                      {markingId === notification.id ? "…" : "Mark read"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
