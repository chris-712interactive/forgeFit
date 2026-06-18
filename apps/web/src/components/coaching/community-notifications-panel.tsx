"use client";

import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/actions/community";
import type { CommunityNotificationRow } from "@/lib/coaching/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const [saving, setSaving] = useState(false);

  async function handleMarkAll() {
    setSaving(true);
    await markAllNotificationsRead();
    setSaving(false);
    router.refresh();
  }

  async function handleMarkOne(id: string) {
    await markNotificationRead(id);
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
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void handleMarkAll()}
            disabled={saving}
            className="text-xs font-medium text-forge-ember underline-offset-2 hover:underline disabled:opacity-60"
          >
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="mt-4 text-sm text-forge-muted">
          No notifications yet. When someone passes you on the board or your
          rival pulls ahead, it will show up here.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className={`rounded-xl border px-3 py-3 ${
                notification.read
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
                {!notification.read && (
                  <button
                    type="button"
                    onClick={() => void handleMarkOne(notification.id)}
                    className="shrink-0 text-[11px] font-medium text-forge-ember"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
