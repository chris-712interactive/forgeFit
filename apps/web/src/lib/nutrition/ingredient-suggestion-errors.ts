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
    return (
      "The ingredient suggestions table isn't visible to the API yet. " +
      "In Supabase: SQL Editor → run migration 20260610880000, then " +
      "Project Settings → API → Reload schema (or run: NOTIFY pgrst, 'reload schema';)."
    );
  }

  if (code === "23503" || /foreign key constraint/i.test(msg)) {
    return (
      "Couldn't link this suggestion to your account profile. " +
      "Try signing out and back in, or finish onboarding first."
    );
  }

  if (code === "42501" || /row-level security|permission denied/i.test(msg)) {
    return (
      "Permission denied saving your suggestion. " +
      "Apply migration 20260610890000_nutrition_ingredient_suggestions_fix.sql, " +
      "then reload the Supabase API schema."
    );
  }

  return msg;
}
