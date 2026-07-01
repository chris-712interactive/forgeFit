import type { CoachingGoal, PreWorkoutHypeInput } from "./types";

const GOAL_HYPE: Record<CoachingGoal, string[]> = {
  fat_loss: [
    "Today's session is a deposit on the body you're building. Move with intent.",
    "Strength work while cutting protects muscle — make every set count.",
    "You don't need perfect — you need present. Let's get after it.",
  ],
  bodybuilding: [
    "Volume is the product. Chase quality reps and leave nothing in the tank.",
    "Another session, another layer. Stack the work.",
    "Mind-muscle connection starts now — own this session.",
  ],
  powerlifting: [
    "Heavy work rewards patience. Execute the plan, rep by rep.",
    "Show up, brace, drive. That's the whole game today.",
    "Strength is built in sessions like this. Make it count.",
  ],
  general_strength: [
    "Consistency beats intensity spikes. One strong session at a time.",
    "You're building real capacity today — not just checking a box.",
    "Train with purpose. Recovery and nutrition do the rest.",
  ],
  recomposition: [
    "Training plus nutrition alignment is your edge — bring the effort today.",
    "Lift hard, stay accountable. Recomp is won in weeks like this.",
    "Build muscle while you lean out. This session matters.",
  ],
  functional_conditioning: [
    "Strength and conditioning in one session — move with intent, breathe, repeat.",
    "Every round builds work capacity. Stay sharp, stay moving.",
    "Compound effort, full-body payoff. Let's run the circuit.",
  ],
};

const EXPERIENCE_PREFIX: Record<
  PreWorkoutHypeInput["experience"],
  string | null
> = {
  beginner: "First reps set the tone — focus on form and finish every set you start.",
  intermediate: null,
  advanced: "You know the drill — execute, autoregulate, and push where it counts.",
};

function hashPick<T>(items: T[], seed: number): T {
  return items[Math.abs(seed) % items.length]!;
}

function namePrefix(displayName?: string | null): string {
  const first = displayName?.trim().split(/\s+/)[0];
  return first ? `${first}, ` : "";
}

export function pickPreWorkoutHype(input: PreWorkoutHypeInput): string {
  const prefix = namePrefix(input.displayName);

  if (input.isDeloadWeek) {
    return `${prefix}deload week — lighter loads, same focus. Recovery is part of the program.`;
  }

  const planned = input.workoutsPlannedThisWeek ?? 0;
  const completed = input.workoutsCompletedThisWeek ?? 0;

  if (planned > 0 && completed >= planned) {
    return `${prefix}you've hit every planned session this week. Optional extra work — stay sharp, not wrecked.`;
  }

  if (planned > 0 && completed === 0) {
    return `${prefix}first session of the week sets the tone. ${input.sessionName} — let's forge it.`;
  }

  if (input.whyStarted && input.whyStarted.length > 12) {
    const trimmed =
      input.whyStarted.length > 80
        ? `${input.whyStarted.slice(0, 77)}…`
        : input.whyStarted;
    return `${prefix}remember: ${trimmed}. Now — ${input.sessionName}.`;
  }

  const experienceLine = EXPERIENCE_PREFIX[input.experience];
  const goalMessages = GOAL_HYPE[input.goal];
  const seed =
    input.sessionName.length * 13 +
    completed * 7 +
    (input.experience === "advanced" ? 3 : input.experience === "beginner" ? 1 : 2);

  const core = hashPick(goalMessages, seed);
  const sessionLead = `${input.sessionName} — `;

  if (experienceLine && input.experience === "beginner") {
    return prefix + sessionLead + experienceLine;
  }

  if (experienceLine && input.experience === "advanced") {
    return prefix + sessionLead + experienceLine + " " + core;
  }

  return prefix + sessionLead + core;
}
