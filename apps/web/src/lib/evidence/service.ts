import {
  EVIDENCE_KB_VERSION,
  getRules,
  getRulesByIds,
  type EvidenceRule,
} from "@forgefit/evidence-kb";
import { getMatchedRules as getProgramMatchedRules } from "@forgefit/program-engine";
import {
  getActiveProgram,
  loadUserProgramContext,
} from "@/lib/programs/service";

export interface EvidencePageData {
  knowledgeBaseVersion: string;
  hasProgram: boolean;
  appliedRuleIds: string[];
  appliedRules: EvidenceRule[];
  matchedRules: EvidenceRule[];
  allRules: EvidenceRule[];
}

export async function getEvidencePageData(
  userId: string
): Promise<EvidencePageData> {
  const [plan, ctx] = await Promise.all([
    getActiveProgram(userId),
    loadUserProgramContext(userId),
  ]);

  const allRules = getRules();
  const matchedRules = ctx
    ? getProgramMatchedRules(allRules, ctx.userProfile)
    : [];

  const appliedRuleIds =
    plan?.appliedRuleIds ??
    matchedRules.map((rule) => rule.id);

  return {
    knowledgeBaseVersion: plan?.evidenceKbVersion ?? EVIDENCE_KB_VERSION,
    hasProgram: Boolean(plan),
    appliedRuleIds,
    appliedRules: getRulesByIds(appliedRuleIds),
    matchedRules,
    allRules,
  };
}
