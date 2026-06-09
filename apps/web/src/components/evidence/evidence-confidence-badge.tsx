import type { EvidenceRule } from "@forgefit/evidence-kb";
import { CONFIDENCE_LABELS } from "@/lib/evidence/present";

const CONFIDENCE_STYLES: Record<EvidenceRule["confidence"], string> = {
  high: "border-forge-success/40 bg-forge-success/10 text-forge-success",
  moderate: "border-forge-gold/40 bg-forge-gold/10 text-forge-gold",
  low: "border-forge-steel/40 bg-forge-steel/10 text-forge-steel",
};

export function EvidenceConfidenceBadge({
  confidence,
}: {
  confidence: EvidenceRule["confidence"];
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${CONFIDENCE_STYLES[confidence]}`}
    >
      {CONFIDENCE_LABELS[confidence]}
    </span>
  );
}
