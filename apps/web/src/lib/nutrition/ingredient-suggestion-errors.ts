import {
  FEATURE_SAVE_TEMPORARILY_UNAVAILABLE,
  memberFacingSchemaError,
} from "@/lib/ui/member-errors";

interface SupabaseLikeError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

export function formatIngredientSuggestionError(error: SupabaseLikeError): string {
  const msg = error.message ?? "Unknown error";
  const code = error.code ?? "";

  if (
    code === "PGRST205" ||
    code === "42P01" ||
    /schema cache|does not exist/i.test(msg)
  ) {
    console.error("ingredient suggestion schema error:", msg);
    return FEATURE_SAVE_TEMPORARILY_UNAVAILABLE;
  }

  if (code === "23503" || /foreign key constraint/i.test(msg)) {
    return (
      "Couldn't link this suggestion to your account profile. " +
      "Try signing out and back in, or finish onboarding first."
    );
  }

  if (code === "42501" || /row-level security|permission denied/i.test(msg)) {
    console.error("ingredient suggestion RLS error:", msg);
    return FEATURE_SAVE_TEMPORARILY_UNAVAILABLE;
  }

  return memberFacingSchemaError(msg);
}
