"use client";

import type { ReactNode } from "react";

interface CollapsibleSectionProps {
  title: string;
  /** Shown beside title when collapsed */
  hint?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

export function CollapsibleSection({
  title,
  hint,
  defaultOpen = false,
  children,
  className = "",
}: CollapsibleSectionProps) {
  return (
    <details
      open={defaultOpen || undefined}
      className={`group rounded-2xl border border-[var(--border)] bg-forge-surface-raised ${className}`}
    >
      <summary className="cursor-pointer list-none px-4 py-3.5 sm:px-5 sm:py-4 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center justify-between gap-3">
          <span className="font-display text-sm font-semibold text-forge-text">
            {title}
          </span>
          {hint && (
            <span className="text-xs font-normal text-forge-muted group-open:hidden">
              {hint}
            </span>
          )}
        </span>
      </summary>
      <div className="border-t border-[var(--border)] px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
        {children}
      </div>
    </details>
  );
}
