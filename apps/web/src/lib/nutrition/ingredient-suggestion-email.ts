export function isIngredientSuggestionEmailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() &&
      process.env.EMAIL_FROM?.trim() &&
      process.env.NUTRITION_INGREDIENT_FEEDBACK_TO?.trim()
  );
}

export async function sendIngredientSuggestionEmail(input: {
  suggestedName: string;
  searchQuery: string;
  categoryHint?: string | null;
  notes?: string | null;
  userEmail?: string | null;
  userId: string;
  suggestionId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const to = process.env.NUTRITION_INGREDIENT_FEEDBACK_TO?.trim();

  if (!apiKey || !from || !to) {
    return { ok: false, error: "Ingredient feedback email is not configured." };
  }

  const lines = [
    `Suggested name: ${input.suggestedName}`,
    `Search query: ${input.searchQuery}`,
    input.categoryHint ? `Category hint: ${input.categoryHint}` : null,
    input.notes ? `Notes: ${input.notes}` : null,
    `User: ${input.userEmail ?? "(no email)"} (${input.userId})`,
    `Suggestion ID: ${input.suggestionId}`,
  ].filter(Boolean);

  const text = lines.join("\n");
  const html = lines
    .filter((line): line is string => line != null)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: `Ingredient suggestion: ${input.suggestedName}`,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return { ok: false, error: body || `Resend error ${response.status}` };
  }

  return { ok: true };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
