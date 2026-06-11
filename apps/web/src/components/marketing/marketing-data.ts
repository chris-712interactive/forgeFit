export const heroPills = [
  "Works offline",
  "Evidence-based",
  "Free to start",
] as const;

export const featureHighlights = [
  {
    title: "Programs built for you",
    description:
      "Fat loss, strength, bodybuilding, and more — scaled to your experience, equipment, and weekly time budget.",
    accent: "bg-forge-ember",
  },
  {
    title: "Log every rep",
    description:
      "Active workout mode with sets, reps, and rest timers. Keep training when the gym has no signal.",
    accent: "bg-forge-coral",
  },
  {
    title: "Nutrition accountability",
    description:
      "Daily macro tracker with food search and targets pulled straight from your plan — not generic calculators.",
    accent: "bg-forge-gold",
  },
  {
    title: "See real progress",
    description:
      "Body measurements, trend charts, caliper body-fat estimates, and 30-day weight projections.",
    accent: "bg-forge-steel",
  },
  {
    title: "800+ exercise library",
    description:
      "Animated demos, muscle heatmaps, and smart substitutions when equipment isn't available.",
    accent: "bg-forge-success",
  },
  {
    title: "Weekly body of work",
    description:
      "Volume lifted, cardio logged, recovery time, and workouts completed — accountability the moment you open the app.",
    accent: "bg-forge-ember",
  },
] as const;

export const howItWorksSteps = [
  {
    step: "01",
    title: "Share your starting point",
    description:
      "Goals, experience level, available equipment, schedule, and measurements — so your plan fits real life.",
  },
  {
    step: "02",
    title: "Get an evidence-based plan",
    description:
      "Workouts and nutrition targets from peer-reviewed rules — deterministic program logic, not AI guesswork.",
  },
  {
    step: "03",
    title: "Log, track, stay accountable",
    description:
      "Home shows today's macros and this week's effort. Every session and meal moves the numbers forward.",
  },
] as const;

export const evidencePoints = [
  "Protein, deficit rate, and volume rules sourced from sports science",
  "Program generation is deterministic — never LLM-written workout logic",
  "Recovery blocks in every session and automatic deload weeks every ~6 training weeks",
] as const;

export const freeTierIncludes = [
  "Personalized program generation",
  "Offline workout logging & sync",
  "Nutrition diary with macro targets",
  "Measurements, trends & 30-day projections",
  "Full exercise library with animations",
] as const;
