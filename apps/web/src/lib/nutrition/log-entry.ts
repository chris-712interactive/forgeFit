export interface MacroLogInput {
  foodName: string;
  calories: number;
  proteinG: number;
  carbsG?: number;
  fatG?: number;
  loggedDate: string;
  mealType?: "breakfast" | "lunch" | "dinner" | "snack";
}

export async function postMacroLogEntry(
  input: MacroLogInput
): Promise<void> {
  const response = await fetch("/api/nutrition/logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: crypto.randomUUID(),
      loggedDate: input.loggedDate,
      mealType: input.mealType,
      foodName: input.foodName.trim(),
      foodSource: "custom",
      servingDescription: "1 serving",
      quantity: 1,
      servingGrams: 1,
      calories: input.calories,
      proteinG: input.proteinG,
      carbsG: input.carbsG ?? 0,
      fatG: input.fatG ?? 0,
    }),
  });

  if (!response.ok) {
    const err = (await response.json()) as { error?: string };
    throw new Error(err.error ?? "Could not log entry");
  }
}
