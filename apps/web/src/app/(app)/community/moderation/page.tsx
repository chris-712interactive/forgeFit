import { redirect } from "next/navigation";

/** Community moderation moved to the admin console. */
export default function CommunityModerationPage() {
  redirect("/community");
}
