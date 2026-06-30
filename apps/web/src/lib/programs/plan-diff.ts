import type { ProgramPlan } from "@forgefit/program-engine";
import { formatPlanStartDateLabel, planScheduleStartIso } from "@/lib/programs/start-date";

function weeklySets(plan: ProgramPlan): number {
  return plan.week.reduce(
    (sum, session) =>
      sum + session.exercises.reduce((setSum, exercise) => setSum + exercise.sets, 0),
    0
  );
}

function averageSessionMinutes(plan: ProgramPlan): number {
  if (plan.week.length === 0) return 0;
  const total = plan.week.reduce((sum, session) => sum + session.estimatedMinutes, 0);
  return Math.round(total / plan.week.length);
}

export function summarizePlanChanges(
  before: ProgramPlan | null,
  after: ProgramPlan
): string[] {
  if (!before) {
    return [
      `New ${after.week.length}-session plan (~${averageSessionMinutes(after)} min/session).`,
      `Starts ${formatPlanStartDateLabel(planScheduleStartIso(after))}.`,
      `Daily targets: ${after.nutrition.calories} kcal · ${after.nutrition.proteinG}g protein.`,
    ];
  }

  const items: string[] = [];

  const beforeStart = before.scheduleStartDate ?? before.generatedAt.slice(0, 10);
  const afterStart = planScheduleStartIso(after);
  if (beforeStart !== afterStart) {
    items.push(`Plan start date set to ${formatPlanStartDateLabel(afterStart)}.`);
  }

  if (after.isDeloadWeek && !before.isDeloadWeek) {
    items.push("Deload week — reduced volume and intensity across sessions.");
  }

  const calorieDelta = after.nutrition.calories - before.nutrition.calories;
  if (calorieDelta !== 0) {
    items.push(
      `Calories ${calorieDelta > 0 ? "+" : ""}${calorieDelta} kcal/day (${after.nutrition.calories} total).`
    );
  }

  const proteinDelta = after.nutrition.proteinG - before.nutrition.proteinG;
  if (proteinDelta !== 0) {
    items.push(
      `Protein ${proteinDelta > 0 ? "+" : ""}${proteinDelta}g/day (${after.nutrition.proteinG}g total).`
    );
  }

  const trainingBefore = before.nutrition.trainingKcalPerDay ?? 0;
  const trainingAfter = after.nutrition.trainingKcalPerDay ?? 0;
  if (trainingAfter !== trainingBefore) {
    items.push(
      `Training burn estimate ${trainingBefore} → ${trainingAfter} kcal/day.`
    );
  }

  const deficitBefore = before.nutrition.effectiveDeficitKcal;
  const deficitAfter = after.nutrition.effectiveDeficitKcal;
  if (
    deficitAfter != null &&
    deficitBefore != null &&
    deficitAfter !== deficitBefore
  ) {
    items.push(
      `Effective deficit ${deficitBefore} → ${deficitAfter} kcal/day.`
    );
  }

  const setsBefore = weeklySets(before);
  const setsAfter = weeklySets(after);
  if (setsAfter !== setsBefore) {
    items.push(`Weekly working sets ${setsBefore} → ${setsAfter}.`);
  }

  const avgBefore = averageSessionMinutes(before);
  const avgAfter = averageSessionMinutes(after);
  if (avgAfter !== avgBefore) {
    items.push(`Average session length ~${avgBefore} → ~${avgAfter} min.`);
  }

  if (before.week.length !== after.week.length) {
    items.push(`Sessions per week ${before.week.length} → ${after.week.length}.`);
  }

  if (items.length === 0) {
    items.push("Plan refreshed — schedule and targets are largely unchanged.");
  }

  return items;
}
