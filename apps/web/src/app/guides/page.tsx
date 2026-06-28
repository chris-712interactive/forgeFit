import { GuidesIndexContent } from "@/components/marketing/guides-index-content";
import { buildGuidesIndexMetadata } from "@/lib/seo/article-metadata";

export const metadata = buildGuidesIndexMetadata();

export default function GuidesPage() {
  return <GuidesIndexContent />;
}
