import { LegalDocument } from "@/components/legal/legal-document";
import { PRIVACY_POLICY } from "@/lib/legal/copy";

export default function PrivacyPage() {
  return <LegalDocument {...PRIVACY_POLICY} />;
}
