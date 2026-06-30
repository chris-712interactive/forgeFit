"use client";

import type { ReactNode } from "react";

interface ProfileSubSectionProps {
  title: string;
  /** Shown beside title when collapsed */
  hint?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function ProfileSubSection({
  title,
  hint,
  defaultOpen = false,
  children,
}: ProfileSubSectionProps) {
  return (
    <details
      open={defaultOpen || undefined}
      className="group rounded-xl border border-[var(--border)] bg-forge-surface"
    >
      <summary className="cursor-pointer list-none px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-forge-text">{title}</span>
          {hint ? (
            <span className="truncate text-xs font-normal text-forge-muted group-open:hidden">
              {hint}
            </span>
          ) : null}
        </span>
      </summary>
      <div className="space-y-4 border-t border-[var(--border)] px-4 pb-4 pt-3">
        {children}
      </div>
    </details>
  );
}
