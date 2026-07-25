import { parseScheduleStartIso } from "@forgefit/program-engine";
import { todayLocalIsoDate } from "@/lib/datetime/local-date";
import { getUserTimeZone } from "@/lib/datetime/timezone";
import {
  isValidPlanStartDate,
  parsePlanStartDateInput,
  todayScheduleStartIso,
} from "@/lib/programs/start-date";

/** Member-local today using the timezone cookie (server-only). */
export async function todayScheduleStartIsoForUser(): Promise<string> {
  try {
    const timeZone = await getUserTimeZone();
    return todayLocalIsoDate(new Date(), timeZone);
  } catch {
    // Outside a request (tests) — fall back to the runtime local calendar.
    return todayScheduleStartIso();
  }
}

export async function resolveProgramStartDate(
  isoDate?: string
): Promise<{ startDate: Date } | { error: string }> {
  const todayIso = await todayScheduleStartIsoForUser();

  if (!isoDate) {
    return { startDate: parseScheduleStartIso(todayIso) };
  }

  if (!isValidPlanStartDate(isoDate, todayIso)) {
    return {
      error: "Choose today or a future date for your new plan to start.",
    };
  }

  return { startDate: parsePlanStartDateInput(isoDate)! };
}
