import { sanitizeReturnTo } from "@/lib/navigation/return-to";

export interface WorkoutSwapReturnTarget {
  clientId: string;
  exerciseIndex: number;
}

export function parseWorkoutSwapReturnTo(
  returnTo: string | null | undefined
): WorkoutSwapReturnTarget | null {
  const safeReturn = sanitizeReturnTo(returnTo);
  if (!safeReturn) return null;

  try {
    const url = new URL(safeReturn, "https://forgerep.local");
    if (!url.pathname.startsWith("/workout")) return null;
    const clientId = url.searchParams.get("active");
    const swapAt = url.searchParams.get("swapAt");
    if (!clientId || swapAt == null) return null;
    const exerciseIndex = Number(swapAt);
    if (!Number.isInteger(exerciseIndex) || exerciseIndex < 0) return null;
    return { clientId, exerciseIndex };
  } catch {
    return null;
  }
}

export function buildWorkoutSwapReturnTo(
  clientId: string,
  exerciseIndex: number
): string {
  return `/workout?active=${encodeURIComponent(clientId)}&swapAt=${exerciseIndex}`;
}
