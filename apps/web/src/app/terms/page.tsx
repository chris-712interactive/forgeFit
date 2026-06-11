import { LegalDocument } from "@/components/legal/legal-document";
import { TERMS_OF_USE } from "@/lib/legal/copy";

export default function TermsPage() {
  return <LegalDocument {...TERMS_OF_USE} />;
}
