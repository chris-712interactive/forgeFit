"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface CollapsibleSectionProps {
  title: string;
  /** Shown beside title when collapsed */
  hint?: string;
  defaultOpen?: boolean;
  /** Sets the details element id and enables hash-based expand for `#${id}`. */
  id?: string;
  /** Additional hash targets (without #) that expand this section when linked. */
  anchorIds?: string[];
  children: ReactNode;
  className?: string;
}

function hashOpensSection(
  id: string | undefined,
  anchorIds: string[] | undefined
): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return null;
  if (id && hash === id) return hash;
  if (anchorIds?.includes(hash)) return hash;
  return null;
}

export function CollapsibleSection({
  title,
  hint,
  defaultOpen = false,
  id,
  anchorIds,
  children,
  className = "",
}: CollapsibleSectionProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function syncOpenFromHash() {
      const details = detailsRef.current;
      if (!details) return;

      const targetId = hashOpensSection(id, anchorIds);
      if (!targetId) return;

      details.open = true;
      requestAnimationFrame(() => {
        const target = document.getElementById(targetId);
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    syncOpenFromHash();
    window.addEventListener("hashchange", syncOpenFromHash);
    return () => window.removeEventListener("hashchange", syncOpenFromHash);
  }, [id, anchorIds]);

  return (
    <details
      ref={detailsRef}
      id={id}
      open={defaultOpen || undefined}
      className={`group scroll-mt-6 rounded-2xl border border-[var(--border)] bg-forge-surface-raised ${className}`}
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
