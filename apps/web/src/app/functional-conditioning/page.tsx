import { FunctionalConditioningLanding } from "@/components/marketing/functional-conditioning-landing";
import { buildFunctionalConditioningMetadata } from "@/lib/seo/functional-conditioning-metadata";

export const metadata = buildFunctionalConditioningMetadata();

export default function FunctionalConditioningPage() {
  return <FunctionalConditioningLanding />;
}
