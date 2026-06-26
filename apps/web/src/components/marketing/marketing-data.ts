import { PRO_PLUS_PRICING, PRO_PRICING } from "@/lib/billing/pricing";

export const heroPills = [
  "Works offline in the gym",
  "Evidence-based programs",
  "Free to start — no card",
] as const;

export const trustStats = [
  { value: "800+", label: "Exercise demos" },
  { value: "100%", label: "Offline workout logging" },
  { value: "30-day", label: "Weight projections" },
  { value: "$0", label: "To get started" },
] as const;

export type FeatureIconKey =
  | "dumbbell"
  | "chart"
  | "nutrition"
  | "offline"
  | "library"
  | "flame";

export const featureHighlights: ReadonlyArray<{
  title: string;
  description: string;
  accent: string;
  icon: FeatureIconKey;
  span?: "wide";
}> = [
  {
    title: "Programs built for your body and schedule",
    description:
      "Fat loss, strength, hypertrophy, and recomposition — scaled to your experience, equipment, and weekly time budget. Not a generic template.",
    accent: "text-forge-ember",
    icon: "dumbbell",
    span: "wide",
  },
  {
    title: "Log every rep — even without signal",
    description:
      "Active workout mode with sets, reps, rest timers, and RIR-based load progression. Your session syncs when you're back online.",
    accent: "text-forge-coral",
    icon: "offline",
  },
  {
    title: "Nutrition that matches your plan",
    description:
      "Daily macro tracker with whole-foods search and targets pulled from your program — not a random online calculator.",
    accent: "text-forge-gold",
    icon: "nutrition",
  },
  {
    title: "Progress you can actually see",
    description:
      "Body measurements, trend charts, caliper body-fat estimates, and weight projections so you know the plan is working.",
    accent: "text-forge-steel",
    icon: "chart",
  },
  {
    title: "800+ exercises with muscle maps",
    description:
      "Animated demos, heatmapped muscle groups, and smart substitutions when equipment isn't available.",
    accent: "text-forge-success",
    icon: "library",
  },
  {
    title: "Weekly body of work",
    description:
      "Volume lifted, cardio logged, recovery time, and workouts completed — accountability the moment you open the app.",
    accent: "text-forge-ember",
    icon: "flame",
  },
] as const;

export const howItWorksSteps = [
  {
    step: "01",
    title: "Share your starting point",
    description:
      "Goals, experience, equipment, schedule, and measurements — so your plan fits real life, not an ideal gym.",
  },
  {
    step: "02",
    title: "Get an evidence-based plan",
    description:
      "Workouts and nutrition targets from peer-reviewed rules — deterministic program logic, never AI guesswork.",
  },
  {
    step: "03",
    title: "Log, track, stay accountable",
    description:
      "Home shows today's macros and this week's effort. Every session and meal moves the numbers forward.",
  },
] as const;

export const evidencePoints = [
  "Protein, deficit rate, and volume rules sourced from sports science literature",
  "Program generation is deterministic — workout structure is never LLM-written",
  "Recovery blocks in every session and automatic deload weeks every ~6 training weeks",
  "Hypertrophy volume scaled to 10–20 hard sets per muscle group per week",
] as const;

export const freeTierIncludes = [
  "Personalized program generation",
  "Offline workout logging & sync",
  "Nutrition diary with macro targets",
  "Measurements, trends & 30-day projections",
  "Full exercise library with animations",
] as const;

export const pricingTiers = [
  {
    id: "free" as const,
    name: "Free",
    price: "$0",
    period: "forever",
    tagline: "Everything you need to train seriously from day one.",
    highlights: freeTierIncludes,
    cta: "Get Started Free",
    featured: false,
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: PRO_PRICING.monthly.label,
    period: "or " + PRO_PRICING.annual.label,
    tagline: "See whether your plan is working over a full season.",
    highlights: [
      "Everything in Free",
      "90-day projections with confidence bands",
      "Strength progression & PR history",
      "Volume trends & nutrition adherence",
      "Unlimited history, export & progress photos",
      "Community leaderboards, rivals & win feed",
    ],
    cta: "Start Free — Upgrade to Pro",
    featured: true,
  },
  {
    id: "pro_plus" as const,
    name: "Pro+",
    price: PRO_PLUS_PRICING.monthly.label,
    period: "or " + PRO_PLUS_PRICING.annual.label,
    tagline: "Sync your devices, log eating out, get coached.",
    highlights: [
      "Everything in Pro",
      "Withings, Fitbit & Strava sync",
      "Restaurant quick-log & saved meals",
      "AI coaching & PR celebration UX",
    ],
    cta: "Start Free — Unlock Pro+",
    featured: false,
  },
] as const;

export const faqItems = [
  {
    question: "Is ForgeRep really free to use?",
    answer:
      "Yes. The Free tier includes personalized program generation, offline workout logging, nutrition tracking with macro targets, body measurements with 30-day weight projections, and the full exercise library. No credit card required to sign up.",
  },
  {
    question: "Does ForgeRep work offline in the gym?",
    answer:
      "ForgeRep is built offline-first. Log sets, reps, and rest timers without cell service. Your workout syncs automatically when you're back online — so a dead zone never kills your session.",
  },
  {
    question: "How is ForgeRep different from other workout tracker apps?",
    answer:
      "Most fitness apps give you a blank log or generic templates. ForgeRep generates a personalized training and nutrition plan from peer-reviewed rules — protein targets, deficit rates, hypertrophy volume, and recovery timing — then holds you accountable with weekly progress on your home screen.",
  },
  {
    question: "Are workouts generated by AI?",
    answer:
      "No. Program logic is deterministic and sourced from the evidence knowledge base. AI is used only for motivational coaching copy on Pro+, never for workout structure or exercise selection.",
  },
  {
    question: "What goals does ForgeRep support?",
    answer:
      "Fat loss, muscle gain, strength, body recomposition, and general fitness. Plans adapt to your experience level, available equipment, and how many days per week you can train.",
  },
  {
    question: "What's included in Pro vs Pro+?",
    answer:
      "Pro adds 90-day projections with confidence bands, strength and volume analytics, unlimited history, progress photos, and community features like leaderboards and rivals. Pro+ includes everything in Pro plus device sync (Withings, Fitbit, Strava), restaurant quick-log, saved meals, and AI-personalized coaching.",
  },
  {
    question: "Can I track macros and calories with ForgeRep?",
    answer:
      "Yes. Your daily protein, carb, and fat targets come from your personalized plan. Log whole foods from the built-in library and see progress bars on your home dashboard — the same screen that shows this week's workouts.",
  },
  {
    question: "Do I need special equipment?",
    answer:
      "No. Onboarding asks what you have access to — full gym, home dumbbells, bands only, or bodyweight — and the program engine builds around it with smart exercise substitutions.",
  },
] as const;

/** Long-form SEO copy — semantic sections for crawlers and skimmers */
export const seoContentSections = [
  {
    id: "workout-tracker",
    heading: "The workout tracker built for real gym sessions",
    paragraphs: [
      "Finding a workout tracker that survives a basement gym with no signal is harder than it should be. ForgeRep is a mobile-first progressive web app designed for the moments that matter: between sets, during rest timers, and when you need to know exactly what comes next.",
      "Log sets, reps, weight, and RIR in active workout mode. ForgeRep tracks volume per muscle group, applies evidence-based load progression, and surfaces your weekly body of work — volume lifted, cardio logged, recovery time, and workouts completed — every time you open the app.",
    ],
  },
  {
    id: "macro-tracker",
    heading: "Macro tracking tied to your training plan",
    paragraphs: [
      "Generic macro calculators treat everyone the same. ForgeRep sets protein, carbohydrate, and fat targets from your goal, body weight, and training volume — aligned with sports nutrition research, not influencer math.",
      "Search whole foods from the curated library, log meals throughout the day, and watch your home dashboard fill in. Nutrition accountability and workout accountability live in one place, so you always know whether you're on track.",
    ],
  },
  {
    id: "personalized-programs",
    heading: "Personalized workout programs — not random templates",
    paragraphs: [
      "Whether you're cutting fat, building muscle, or getting stronger, ForgeRep generates a periodized plan matched to your schedule, equipment, and experience. Hypertrophy sessions scale to research-backed volume ranges. Strength blocks prioritize compound lifts. Deload weeks arrive automatically every six training weeks.",
      "Every rule in the program engine traces to peer-reviewed sources in the evidence knowledge base. That means your plan is explainable, citable, and consistent — the same inputs always produce the same structure.",
    ],
  },
  {
    id: "progress-tracking",
    heading: "Body measurements, trends, and weight projections",
    paragraphs: [
      "Scale weight alone tells an incomplete story. ForgeRep tracks body measurements, estimates body fat from caliper readings, and charts trends over time. Free members get 30-day weight projections; Pro members unlock 90-day forecasts with confidence bands and goal dates.",
      "Progress photos, exportable history, and rule-based insights on Pro help you see the full picture — not just today's number on the scale.",
    ],
  },
] as const;

export const footerNav = {
  product: [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ],
  account: [
    { label: "Sign up free", href: "/signup" },
    { label: "Sign in", href: "/login" },
  ],
} as const;
