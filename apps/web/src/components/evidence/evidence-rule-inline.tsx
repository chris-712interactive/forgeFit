import { getRuleById } from "@forgefit/evidence-kb";
import { buildEvidenceHref, getRuleTitle } from "@/lib/evidence/present";
import { EvidenceExplainerLink } from "./evidence-explainer-link";

export function EvidenceRuleInline({ ruleId }: { ruleId: string }) {
  const rule = getRuleById(ruleId);
  const label = rule ? getRuleTitle(rule) : ruleId;

  return (
    <EvidenceExplainerLink
      href={buildEvidenceHref({ focus: ruleId })}
      label={label}
    />
  );
}
