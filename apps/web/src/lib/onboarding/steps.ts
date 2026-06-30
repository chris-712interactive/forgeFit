import {
  sportRequiresPosition,
} from "@forgefit/evidence-kb";
import {
  maxMinutesPerSessionForAge,
  maxSessionsPerWeekForAge,
  requiresParentConsent,
} from "@forgefit/program-engine";
import {
  computeAgeFromDateOfBirth,
  isValidDateOfBirth,
} from "@/lib/profile/identity";
import type { OnboardingData } from "@/lib/types/profile";
import { bodyCompositionStepValid } from "@/components/onboarding/body-composition-target-step";
import { resolvedSportPracticeGymPolicy } from "@/lib/onboarding/sport-practice";

export type OnboardingStepId =
  | "disclaimer"
  | "goal"
  | "sport_category"
  | "sport"
  | "sport_position"
  | "sport_season"
  | "sport_practice"
  | "secondary_goal"
  | "experience"
  | "about_you"
  | "parent_consent"
  | "measurements"
  | "body_comp"
  | "equipment"
  | "recovery"
  | "time"
  | "why"
  | "finish";

export function buildOnboardingSteps(
  data: Partial<OnboardingData>
): OnboardingStepId[] {
  const steps: OnboardingStepId[] = ["disclaimer", "goal"];

  if (data.primary_goal === "sport_performance") {
    steps.push("sport_category", "sport");
    if (sportRequiresPosition(data.sport_id)) {
      steps.push("sport_position");
    }
    steps.push("sport_season", "sport_practice", "secondary_goal");
  }

  steps.push("experience", "about_you");

  if (
    data.date_of_birth &&
    isValidDateOfBirth(data.date_of_birth) &&
    requiresParentConsent(computeAgeFromDateOfBirth(data.date_of_birth))
  ) {
    steps.push("parent_consent");
  }

  steps.push(
    "measurements",
    "body_comp",
    "equipment",
    "recovery",
    "time",
    "why",
    "finish"
  );

  return steps;
}

export function stepTitle(stepId: OnboardingStepId): string {
  switch (stepId) {
    case "disclaimer":
      return "Before we begin";
    case "goal":
      return "What matters most?";
    case "sport_category":
      return "Sport category";
    case "sport":
      return "Your sport";
    case "sport_position":
      return "Your position";
    case "sport_season":
      return "Season timing";
    case "sport_practice":
      return "Practice schedule";
    case "secondary_goal":
      return "Also working on…";
    case "experience":
      return "How experienced are you?";
    case "about_you":
      return "About you";
    case "parent_consent":
      return "Parent or guardian";
    case "measurements":
      return "Your measurements";
    case "body_comp":
      return "Body composition";
    case "equipment":
      return "What equipment do you have?";
    case "recovery":
      return "Recovery tools";
    case "time":
      return "How much time do you have?";
    case "why":
      return "Why did you start?";
    case "finish":
      return "Almost done";
    default:
      return "";
  }
}

export function stepSubtitle(stepId: OnboardingStepId): string {
  switch (stepId) {
    case "disclaimer":
      return "Please read and acknowledge before continuing.";
    case "goal":
      return "Sport or physique — we'll build your plan around this.";
    case "sport_category":
      return "Pick the group that best matches your sport.";
    case "sport":
      return "US school and club sports — more coming soon.";
    case "sport_position":
      return "Position changes how we emphasize strength and power.";
    case "sport_season":
      return "In-season plans keep gym work from interfering with practices.";
    case "sport_practice":
      return "We avoid stacking hard gym sessions on practice days when you ask us to.";
    case "secondary_goal":
      return "Optional — your sport plan always comes first.";
    case "experience":
      return "No wrong answer — we'll meet you where you are.";
    case "about_you":
      return "We'll personalize your plan and milestones.";
    case "parent_consent":
      return "Because you're under 16, a parent or guardian needs to know you're using ForgeRep.";
    case "measurements":
      return "Choose your units once — we handle conversions behind the scenes.";
    case "body_comp":
      return "We tailor calories from evidence — not generic cuts.";
    case "equipment":
      return "Select everything available to you.";
    case "recovery":
      return "Optional — we'll weave these into your plan.";
    case "time":
      return "Any amount works — we'll make it count.";
    case "why":
      return "We'll remind you of this when you need it most.";
    case "finish":
      return "Add ForgeRep to your home screen for faster access and offline workouts — optional.";
    default:
      return "";
  }
}

export function canProceedStep(
  stepId: OnboardingStepId,
  data: Partial<OnboardingData>
): boolean {
  switch (stepId) {
    case "disclaimer":
      return data.health_disclaimer_accepted === true;
    case "goal":
      return !!data.primary_goal;
    case "sport_category":
      return !!data.sport_category_id;
    case "sport":
      return !!data.sport_id;
    case "sport_position":
      return !!data.sport_position_id;
    case "sport_season":
      return !!data.sport_season_phase;
    case "sport_practice":
      return (
        !!resolvedSportPracticeGymPolicy(
          data.sport_practice_gym_policy,
          data.sport_season_phase
        ) &&
        (data.sport_practice_schedule_varies === true ||
          (data.sport_practice_days?.length ?? 0) > 0)
      );
    case "secondary_goal":
      return true;
    case "experience":
      return !!data.experience_level;
    case "about_you":
      return (
        !!data.first_name?.trim() &&
        !!data.last_name?.trim() &&
        !!data.date_of_birth
      );
    case "parent_consent":
      return (
        data.parent_consent_acknowledged === true &&
        !!data.parent_consent_name?.trim() &&
        !!data.parent_consent_email?.trim() &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.parent_consent_email.trim())
      );
    case "measurements":
      return !!data.sex && !!data.height_cm && !!data.weight_kg;
    case "body_comp":
      return bodyCompositionStepValid(data);
    case "equipment":
      return (data.equipment?.length ?? 0) > 0;
    case "recovery":
      return true;
    case "time":
      return !!data.sessions_per_week && !!data.minutes_per_session;
    case "why":
      return (data.why_started?.trim().length ?? 0) >= 10;
    case "finish":
      return true;
    default:
      return false;
  }
}

export function resolveProfileAgeFromData(
  data: Partial<OnboardingData>
): number | null {
  if (!data.date_of_birth || !isValidDateOfBirth(data.date_of_birth)) {
    return null;
  }
  return computeAgeFromDateOfBirth(data.date_of_birth);
}

export function clampTimeBudgetForData(data: Partial<OnboardingData>): Partial<OnboardingData> {
  const age = resolveProfileAgeFromData(data);
  if (age == null) return data;

  const maxSessions = maxSessionsPerWeekForAge(age);
  const maxMinutes = maxMinutesPerSessionForAge(age);
  const patch: Partial<OnboardingData> = {};

  if (data.sessions_per_week && data.sessions_per_week > maxSessions) {
    patch.sessions_per_week = maxSessions;
  }
  if (data.minutes_per_session && data.minutes_per_session > maxMinutes) {
    patch.minutes_per_session = maxMinutes;
  }

  return Object.keys(patch).length > 0 ? { ...data, ...patch } : data;
}
