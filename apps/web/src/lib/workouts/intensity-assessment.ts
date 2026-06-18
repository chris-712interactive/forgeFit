import { getRules, matchRules, type RuleContext } from "@forgefit/evidence-kb";
import type { ExperienceLevel, FitnessGoal } from "@/lib/types/profile";
import type {
  DeviceMatchConfidence,
  IntensityBand,
  IntensityVerdict,
  RirAgreement,
} from "./device-metrics-types";

export interface LoggedSessionStats {
  avgRir: number | null;
  hardSets: number;
  durationMinutes: number | null;
}

export interface DeviceSessionStats {
  avgHeartRateBpm: number | null;
  activeZoneMinutes: number | null;
  zonePeakSeconds: number | null;
  zoneCardioSeconds: number | null;
  zoneFatBurnSeconds: number | null;
  matchConfidence: DeviceMatchConfidence;
}

export interface IntensityAssessmentInput {
  goal: FitnessGoal;
  experience: ExperienceLevel;
  isDeloadWeek: boolean;
  logged: LoggedSessionStats;
  device: DeviceSessionStats;
}

export interface IntensityAssessmentResult {
  intensityBand: IntensityBand | null;
  intensityVerdict: IntensityVerdict;
  rirAgreement: RirAgreement | null;
  evidenceRuleId: string;
  headline: string;
  detail: string;
}

interface SessionIntensityTargets {
  ruleId: string;
  rirMin: number;
  rirMax: number;
  azmMin: number;
  azmMax: number;
  peakZoneMaxPct: number;
}

function ruleContext(
  goal: FitnessGoal,
  experience: ExperienceLevel
): RuleContext {
  return {
    goal,
    experience,
    weightKg: 75,
    heightCm: 175,
  };
}

function pickIntensityRuleId(goal: FitnessGoal): string {
  switch (goal) {
    case "bodybuilding":
    case "recomposition":
      return "session_intensity_hypertrophy";
    case "fat_loss":
      return "session_intensity_fat_loss";
    case "powerlifting":
    case "general_strength":
    default:
      return "session_intensity_strength";
  }
}

function targetsForGoal(
  goal: FitnessGoal,
  experience: ExperienceLevel
): SessionIntensityTargets {
  const ctx = ruleContext(goal, experience);
  const rules = matchRules(getRules(), ctx);
  const ruleId = pickIntensityRuleId(goal);

  const azmRange = rules.find((rule) => rule.id === ruleId)?.recommendation
    .session_azm as { min?: number; max?: number } | undefined;

  const peakPct = rules.find((rule) => rule.id === ruleId)?.recommendation
    .peak_zone_max_pct as number | undefined;

  const rirRule =
    goal === "powerlifting"
      ? rules.find((rule) => rule.id === "powerlifting_intensity")
      : goal === "bodybuilding" || goal === "recomposition"
        ? rules.find((rule) => rule.id === "hypertrophy_rep_range")
        : rules.find((rule) => rule.id === "strength_rep_range");

  const rirRec = rirRule?.recommendation.rir as
    | { min?: number; max?: number }
    | undefined;

  return {
    ruleId,
    rirMin: rirRec?.min ?? 1,
    rirMax: rirRec?.max ?? 3,
    azmMin: azmRange?.min ?? 8,
    azmMax: azmRange?.max ?? 25,
    peakZoneMaxPct: peakPct ?? 0.4,
  };
}

function totalActiveZoneSeconds(device: DeviceSessionStats): number {
  return (
    (device.zonePeakSeconds ?? 0) +
    (device.zoneCardioSeconds ?? 0) +
    (device.zoneFatBurnSeconds ?? 0)
  );
}

function peakZonePct(device: DeviceSessionStats): number | null {
  const active = totalActiveZoneSeconds(device);
  if (active <= 0 || device.zonePeakSeconds == null) return null;
  return device.zonePeakSeconds / active;
}

export function deriveIntensityBand(
  device: DeviceSessionStats
): IntensityBand | null {
  const azm = device.activeZoneMinutes;
  if (azm == null && device.avgHeartRateBpm == null) return null;

  if (azm != null) {
    if (azm <= 7) return "low";
    if (azm <= 25) return "moderate";
    return "high";
  }

  const hr = device.avgHeartRateBpm ?? 0;
  if (hr < 100) return "low";
  if (hr < 135) return "moderate";
  return "high";
}

function deriveRirAgreement(
  logged: LoggedSessionStats,
  band: IntensityBand | null
): RirAgreement | null {
  if (logged.avgRir == null || band == null) return null;

  const loggedEasy = logged.avgRir >= 3;
  const loggedHard = logged.avgRir <= 0;

  if (loggedEasy && band === "high") return "harder_than_logged";
  if (loggedHard && band === "low") return "easier_than_logged";
  return "aligned";
}

export function assessSessionIntensity(
  input: IntensityAssessmentInput
): IntensityAssessmentResult {
  const targets = targetsForGoal(input.goal, input.experience);
  const band = deriveIntensityBand(input.device);
  const peakPct = peakZonePct(input.device);
  const azm = input.device.activeZoneMinutes;
  const avgRir = input.logged.avgRir;

  if (
    input.device.matchConfidence === "none" ||
    input.device.matchConfidence === "low"
  ) {
    return {
      intensityBand: band,
      intensityVerdict: "inconclusive",
      rirAgreement: deriveRirAgreement(input.logged, band),
      evidenceRuleId: targets.ruleId,
      headline: "Watch data inconclusive",
      detail:
        "We couldn't confidently match a Fitbit exercise session to this workout. Pre-workout readiness signals still apply.",
    };
  }

  const rirAgreement = deriveRirAgreement(input.logged, band);

  if (rirAgreement === "harder_than_logged") {
    return {
      intensityBand: band,
      intensityVerdict: "on_target",
      rirAgreement,
      evidenceRuleId: targets.ruleId,
      headline: "Heart rate ran higher than logged effort",
      detail:
        "Your watch recorded moderate-to-high intensity while sets were logged as Easy. Consider matching RIR labels to how the session actually felt.",
    };
  }

  if (input.isDeloadWeek && (azm ?? 0) >= targets.azmMax && (peakPct ?? 0) > 0.35) {
    return {
      intensityBand: band,
      intensityVerdict: "too_hard",
      rirAgreement,
      evidenceRuleId: "deload_intermediate",
      headline: "High intensity during deload",
      detail:
        "Active Zone Minutes and peak heart-rate time look elevated for a deload week. Keep reps easy and prioritize recovery.",
    };
  }

  const tooEasyLogged =
    avgRir != null && avgRir >= 3 && (input.logged.hardSets === 0 || avgRir >= 4);
  const lowDevice =
    (azm != null && azm < targets.azmMin) || band === "low";

  if (tooEasyLogged && lowDevice && !input.isDeloadWeek) {
    return {
      intensityBand: band,
      intensityVerdict: "too_easy",
      rirAgreement,
      evidenceRuleId: targets.ruleId,
      headline: "Room to push next time",
      detail: `Logged effort was easy and watch intensity was low. For your ${input.goal.replace("_", " ")} goal, aim for ${targets.rirMin}–${targets.rirMax} RIR on working sets.`,
    };
  }

  const tooHardLogged = avgRir != null && avgRir <= 0;
  const highDevice =
    band === "high" ||
    (azm != null && azm > targets.azmMax) ||
    (peakPct != null && peakPct > targets.peakZoneMaxPct);

  if (tooHardLogged || (highDevice && !input.isDeloadWeek && tooEasyLogged === false)) {
    if (tooHardLogged || highDevice) {
      const verdict: IntensityVerdict =
        tooHardLogged || (highDevice && (avgRir ?? 2) <= 1)
          ? "too_hard"
          : "on_target";

      if (verdict === "too_hard") {
        return {
          intensityBand: band,
          intensityVerdict: verdict,
          rirAgreement,
          evidenceRuleId: targets.ruleId,
          headline: "Accumulated session stress",
          detail:
            "Heart rate zones or logged RIR suggest this session was very demanding. Prioritize sleep and keep the next session autoregulated.",
        };
      }
    }
  }

  const rirInRange =
    avgRir == null ||
    (avgRir >= targets.rirMin - 0.5 && avgRir <= targets.rirMax + 0.5);
  const deviceInRange =
    azm == null ||
    (azm >= targets.azmMin && azm <= targets.azmMax) ||
    band === "moderate";

  if (rirInRange && deviceInRange) {
    return {
      intensityBand: band,
      intensityVerdict: "on_target",
      rirAgreement,
      evidenceRuleId: targets.ruleId,
      headline: "On target for your goal",
      detail: `Logged effort and watch intensity align with your ${input.goal.replace("_", " ")} training targets.`,
    };
  }

  if (lowDevice && !tooEasyLogged) {
    return {
      intensityBand: band,
      intensityVerdict: "too_easy",
      rirAgreement,
      evidenceRuleId: targets.ruleId,
      headline: "Session intensity was light",
      detail:
        "Heart rate and Active Zone Minutes stayed low relative to your goal. You may have capacity for heavier or more demanding work next time.",
    };
  }

  return {
    intensityBand: band,
    intensityVerdict: "on_target",
    rirAgreement,
    evidenceRuleId: targets.ruleId,
    headline: "Session logged",
    detail: "Device and logged effort are within a reasonable range for continued progression.",
  };
}

export function verdictLabel(verdict: IntensityVerdict): string {
  switch (verdict) {
    case "on_target":
      return "On target";
    case "too_easy":
      return "Room to push";
    case "too_hard":
      return "High stress";
    case "inconclusive":
      return "Inconclusive";
  }
}
