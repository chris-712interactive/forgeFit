export type Confidence = "high" | "moderate" | "low";

export interface Citation {
  doi?: string;
  url?: string;
  summary: string;
}

export interface EvidenceRule {
  id: string;
  domain: string;
  applies_to: string[];
  recommendation: Record<string, unknown>;
  citations: Citation[];
  confidence: Confidence;
}
