"use client";

import {
  moderateHideWin,
  moderateSetSuspended,
  moderateUnhideWin,
} from "@/app/actions/community";
import type { CommunityWinRow } from "@/lib/coaching/types";
import { readActionError } from "@/lib/auth/action-result";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CommunityWinModerationControlsProps {
  win: CommunityWinRow;
}

export function CommunityWinModerationControls({
  win,
}: CommunityWinModerationControlsProps) {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hidden = Boolean(win.hiddenAt);

  async function runAction(
    key: string,
    action: () => Promise<{ ok: boolean; error?: string }>
  ) {
    setBusyKey(key);
    setError(null);
    const result = await action();
    setBusyKey(null);

    if (!result.ok) {
      setError(readActionError(result) ?? "Action failed.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="mt-3 border-t border-[var(--border)] pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-forge-muted">
          Moderator
          {hidden ? " · hidden from feed" : ""}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {hidden ? (
            <button
              type="button"
              disabled={busyKey != null}
              onClick={() =>
                void runAction(`unhide-${win.id}`, () => moderateUnhideWin(win.id))
              }
              className="rounded-lg border border-forge-gold/35 px-2.5 py-1 text-[11px] font-medium text-forge-gold hover:bg-forge-gold/10 disabled:opacity-60"
            >
              Unhide
            </button>
          ) : (
            <button
              type="button"
              disabled={busyKey != null}
              onClick={() =>
                void runAction(`hide-${win.id}`, () => moderateHideWin(win.id))
              }
              className="rounded-lg border border-forge-coral/35 px-2.5 py-1 text-[11px] font-medium text-forge-coral hover:bg-forge-coral/10 disabled:opacity-60"
            >
              Hide
            </button>
          )}
          <button
            type="button"
            disabled={busyKey != null}
            onClick={() =>
              void runAction(`suspend-${win.id}`, () =>
                moderateSetSuspended({
                  targetUserId: win.userId,
                  suspended: true,
                })
              )
            }
            className="rounded-lg border border-[var(--border)] px-2.5 py-1 text-[11px] font-medium text-forge-muted hover:text-forge-text disabled:opacity-60"
          >
            Suspend user
          </button>
        </div>
      </div>
      {error && (
        <p className="mt-2 text-xs text-forge-coral" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
