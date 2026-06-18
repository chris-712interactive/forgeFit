# Fitbit / Google Health Expansion Plan

> Roadmap for turning device sync into a well-rounded recovery and lifestyle signal layer.  
> **Phases 1–5** are implemented.

## Current state (Phases 1–5 — shipped)

| Data | Google Health type | OAuth scope | Storage | UI |
|------|-------------------|-------------|---------|-----|
| Steps | `steps` dailyRollUp | `activity_and_fitness.readonly` | `daily_activity_logs` | Home, Progress |
| Active calories | `active-energy-burned` dailyRollUp | same | `daily_activity_logs` | Home, Progress |
| Active minutes | `active-minutes` dailyRollUp | same | `daily_activity_logs` | Home, Progress |
| **Active Zone Minutes** | `active-zone-minutes` dailyRollUp | same | `daily_activity_logs` | **Progress, Home** |
| **Sedentary time** | `sedentary-period` dailyRollUp | same | `daily_activity_logs` | **Progress** |
| **Total calories** | `total-calories` dailyRollUp | same | `daily_activity_logs` | **Progress** |
| Sleep duration | `sleep` list (sessions) | `sleep.readonly` | `daily_sleep_logs` | Home, Progress |
| Sleep stages (deep/REM) | parsed from session summary | `sleep.readonly` | `daily_sleep_logs` | Progress detail |
| **Resting HR range** | `daily-resting-heart-rate` **list** | **`health_metrics_and_measurements.readonly`** | **`daily_recovery_logs`** | **Progress** |
| **HRV range** | `daily-heart-rate-variability` **list** | same | `daily_recovery_logs` | **Progress** |
| **Exercise sessions** | `exercise` **list** | `activity_and_fitness.readonly` | **`workout_device_metrics`** + `external_activity_logs` | **Workout recap, Active workout** |

**Sync:** `syncFitbitForUser()` on connect, Profile/Home/Progress visit (6h stale window), daily cron, post-workout `/api/sync` via `after()`.  
**Insights:** Short sleep (Pro); elevated RHR during deload; HRV suppressed when volume climbs; high steps + low AZM; sedentary streak + missed sessions; **device vs logged RIR mismatch; repeated low-intensity gym sessions**.  
**Scorecard (Pro):** Weekly cross-pillar strip on Home + Progress — Training pillar includes **on-target intensity ratio** when device data exists.

**Existing users:** Must **reconnect Fitbit** to grant new scopes (sleep, then health metrics). Activity-only tokens continue to work for steps/calories and **exercise session correlation** (same activity scope).

---

## Design principles

1. **Daily rollups for activity, session list for sleep/recovery/exercise** — match Google Health API shapes; avoid inventing aggregation logic the API already provides.
2. **One OAuth connect, multiple scopes** — request only `googlehealth.*` scopes (never mix legacy `fitness.*`).
3. **Store normalized daily rows** — keep raw vendor complexity in `@forgefit/integrations`; app reads simple tables with RLS.
4. **Cross-signal insights over siloed charts** — highest value is correlating sleep + training + nutrition, not another dashboard tile.
5. **Graceful degradation** — missing scope or partial sync must not break activity sync.

---

## Phase 2 — Recovery metrics (resting HR, HRV) ✅ Shipped

Migration: `20260610300000_daily_recovery_logs.sql`

---

## Phase 3 — Activity depth (zone minutes, sedentary, total calories) ✅ Shipped

Migration: `20260610400000_daily_activity_extended.sql`

---

## Phase 4 — Cross-pillar “problem area” engine ✅ Shipped

`buildWeeklyScorecard()` — composite Training · Protein · Sleep · Recovery · Activity pillars.

---

## Phase 5 — Workout–device correlation (optimal zone) ✅ Shipped

Migration: `20260610500000_workout_device_metrics.sql`

**Goal:** Match ForgeRep `workout_sessions` to Fitbit `exercise` sessions by time overlap; assess intensity vs goal (RIR + heart rate + AZM).

| Component | Location |
|-----------|----------|
| Exercise fetch | `fetchExerciseSessions()` in `@forgefit/integrations` |
| Correlation | `device-correlation.ts`, `device-metrics-service.ts` |
| Goal-aware verdicts | `intensity-assessment.ts` + evidence-kb session intensity rules |
| Triggers | `POST /api/sync` (`after()`), `syncFitbitForUser()`, backfill in `fitbit-sync-scheduler` |
| UI | Pre-workout readiness strip; post-workout intensity card on recap |

Unmatched Fitbit cardio upserts to `external_activity_logs` with `source = google_health`.

Next: Phase 6.

---

## Phase 6 — Strava + weight (Withings) unification

**Goal:** Single “body of work” timeline: lifts (ForgeRep), cardio (Strava + Google Health), weight (Withings), lifestyle (Fitbit daily).

| Source | Status | Data |
|--------|--------|------|
| Fitbit / Google Health | Live | Activity + sleep + per-workout intensity |
| Withings | Code ready | Weight → `body_measurements` |
| Strava | Code ready | Cardio → `external_activity_logs` |

---

## Phase 7 — Optional advanced signals

| Signal | API scope | Use case |
|--------|-----------|----------|
| Live HR during workout | `exercise` + polling | In-session zone strip (deferred) |
| VO2 Max | `activity_and_fitness` | Cardio fitness trend |
| Time in HR zones | dailyRollUp | Intensity distribution |
| Body fat (Fitbit scale) | `health_metrics` | Composition trend |

---

## OAuth scope checklist

| Scope | Phase |
|-------|-------|
| `googlehealth.activity_and_fitness.readonly` | ✅ Live (includes exercise list) |
| `googlehealth.sleep.readonly` | ✅ Phase 1 |
| `googlehealth.health_metrics_and_measurements.readonly` | ✅ Phase 2–3 |

**Never** pass `include_granted_scopes=true` on authorize URL.

---

## Ops checklist (each phase)

- [x] Supabase migration + RLS `select` for own rows  
- [x] `@forgefit/integrations` fetch + unit-test response parsing  
- [x] Extend `syncFitbitForUser` with isolated try/catch per data family  
- [x] Backfill trigger in `fitbit-sync-scheduler` when metrics missing  
- [x] Update Profile connect disclosure  
- [x] Workout UI + Pro insight rules  
- [x] Document in `docs/phases/07-integrations.md`

---

## References

- [Google Health data types](https://developers.google.com/health/data-types)  
- [Exercise list](https://developers.google.com/health/reference/rest/v4/users.dataTypes.dataPoints/list)  
- ForgeRep evidence rules: `session_intensity_*`, `recovery_sleep`, `hypertrophy_rep_range`
