import type { Citation } from "@forgefit/evidence-kb";
import { citationHref, citationLabel } from "@/lib/evidence/present";

export function EvidenceCitationList({ citations }: { citations: Citation[] }) {
  return (
    <ul className="space-y-3">
      {citations.map((citation, index) => {
        const href = citationHref(citation);
        return (
          <li
            key={`${citation.summary}-${index}`}
            className="rounded-xl border border-[var(--border)] bg-forge-surface px-3 py-3"
          >
            <p className="text-sm text-forge-text">{citation.summary}</p>
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex text-xs font-semibold text-forge-steel hover:text-forge-ember"
              >
                {citationLabel(citation)} →
              </a>
            ) : (
              <p className="mt-2 text-xs text-forge-muted">Source on file</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
