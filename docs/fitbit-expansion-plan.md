# Fitbit / Google Health Expansion Plan

> Roadmap for turning device sync into a well-rounded recovery and lifestyle signal layer.  
> **Phase 1 (sleep)** and **Phase 2 (recovery metrics)** are implemented.

## Current state (Phases 1–2 — shipped)

| Data | Google Health type | OAuth scope | Storage | UI |
|------|-------------------|-------------|---------|-----|
| Steps | `steps` dailyRollUp | `activity_and_fitness.readonly` | `daily_activity_logs` | Home, Progress |
| Active calories | `active-energy-burned` dailyRollUp | same | `daily_activity_logs` | Home, Progress |
| Active minutes | `active-minutes` dailyRollUp | same | `daily_activity_logs` | Home, Progress |
| Sleep duration | `sleep` list (sessions) | `sleep.readonly` | `daily_sleep_logs` | Home, Progress |
| Sleep stages (deep/REM) | parsed from session summary | `sleep.readonly` | `daily_sleep_logs` | Progress detail |
| **Resting HR range** | `daily-resting-heart-rate` dailyRollUp | **`health_metrics_and_measurements.readonly`** | **`daily_recovery_logs`** | **Progress** |
| **HRV range** | `daily-heart-rate-variability` dailyRollUp | same | `daily_recovery_logs` | **Progress** |

**Sync:** `syncFitbitForUser()` on connect, Profile/Home/Progress visit (6h stale window), daily cron.  
**Insights:** Short sleep (Pro); elevated RHR during deload; HRV suppressed when volume climbs.

**Existing users:** Must **reconnect Fitbit** to grant new scopes (sleep, then health metrics). Activity-only tokens continue to work for steps/calories.

---

## Design principles

1. **Daily rollups for activity, session list for sleep** — match Google Health API shapes; avoid inventing aggregation logic the API already provides.
2. **One OAuth connect, multiple scopes** — request only `googlehealth.*` scopes (never mix legacy `fitness.*`).
3. **Store normalized daily rows** — keep raw vendor complexity in `@forgefit/integrations`; app reads simple tables with RLS.
4. **Cross-signal insights over siloed charts** — highest value is correlating sleep + training + nutrition, not another dashboard tile.
5. **Graceful degradation** — missing scope or partial sync must not break activity sync.

---

## Phase 2 — Recovery metrics (resting HR, HRV) ✅ Shipped

Migration: `20260610300000_daily_recovery_logs.sql`

See **Current state** table above. Next: Phase 3.

---

## Phase 3 — Activity depth (zone minutes, sedentary, total calories)

**Goal:** Better “NEAT” and cardio context beyond raw steps.

| Metric | API | Notes |
|--------|-----|-------|
| Active Zone Minutes | `active-zone-minutes` dailyRollUp | Aligns with Fitbit AZM; may replace hand-rolled active-minutes sum |
| Sedentary time | `sedentary-period` dailyRollUp | 14-day max range per request |
| Total calories | `total-calories` dailyRollUp | 14-day max; distinct from active calories |

**Storage:** Extend `daily_activity_logs` or add `daily_activity_extended` JSON column to avoid wide table sprawl.  
**Insights:**

- Sedentary streak + missed sessions  
- Steps high but AZM low (lots of walking, little cardio)

**Effort:** ~4–6 days.

---

## Phase 4 — Cross-pillar “problem area” engine

**Goal:** Unified weekly scorecard: Training · Nutrition · Sleep · Recovery · Activity.

```
Weekly scorecard (example)
├── Training:  4/5 sessions ✓
├── Protein:   5/7 days on target ✓
├── Sleep:     2/7 nights ≥ 7h ⚠
└── Recovery:  HRV down 3 days ⚠  → "Recovery debt"
```

**Implementation:**

- `packages/coaching` or `apps/web/src/lib/analytics/insights.ts` — composite `buildWeeklyScorecard()`  
- Feed: sessions, nutrition adherence, sleep logs, recovery logs (Phases 2–3)  
- Home: compact strip linking to Progress Trends  
- Tie citations to `evidence-kb` rules (`recovery_sleep`, deload, protein)

**Effort:** ~1 week after Phases 2–3 data exists.

---

## Phase 5 — Strava + weight (Withings) unification

**Goal:** Single “body of work” timeline: lifts (ForgeRep), cardio (Strava), weight (Withings), lifestyle (Fitbit).

| Source | Status | Data |
|--------|--------|------|
| Fitbit / Google Health | Live | Activity + sleep |
| Withings | Code ready | Weight → `body_measurements` |
| Strava | Code ready | Cardio → `external_activity_logs` |

**UI:** Progress Training tab merges Strava cardio with logged sessions; weight chart auto-updates from Withings.  
**Insights:** Cardio volume vs leg day recovery; weight trend vs nutrition adherence.

**Effort:** Vendor unblock + ~3 days integration polish each.

---

## Phase 6 — Optional advanced signals

Lower priority until MAU justifies complexity:

| Signal | API scope | Use case |
|--------|-----------|----------|
| VO2 Max | `activity_and_fitness` | Cardio fitness trend |
| Time in HR zones | dailyRollUp | Intensity distribution |
| Sleep temperature derivations | `health_metrics` | Illness / overtraining hints |
| Body fat (Fitbit scale) | `health_metrics` | Composition trend |

---

## OAuth scope checklist

Add scopes incrementally; each new scope requires **reconnect** for existing users.

| Scope | Phase |
|-------|-------|
| `googlehealth.activity_and_fitness.readonly` | ✅ Live |
| `googlehealth.sleep.readonly` | ✅ Phase 1 |
| `googlehealth.health_metrics_and_measurements.readonly` | Phase 2–3 |
| `googlehealth.nutrition.readonly` | Future (if importing Fitbit food log) |

**Never** pass `include_granted_scopes=true` on authorize URL.

---

## Ops checklist (each phase)

- [ ] Supabase migration + RLS `select` for own rows  
- [ ] `@forgefit/integrations` fetch + unit-test response parsing against Google REST field names  
- [ ] Extend `syncFitbitForUser` with isolated try/catch per data family  
- [ ] Backfill trigger in `fitbit-sync-scheduler` when new columns empty  
- [ ] Update Profile connect disclosure + privacy copy  
- [ ] Progress UI + at least one Pro insight rule  
- [ ] Document in `docs/phases/07-integrations.md`

---

## Success metrics

- **Adoption:** % of Pro+ Fitbit users with sleep data after reconnect  
- **Engagement:** Home/Progress views with device data populated  
- **Insight CTR:** Users acting on sleep/recovery nudges (future: track dismiss/snooze)  
- **Support:** Reduction in “data not showing” tickets (parser + scope docs)

---

## References

- [Google Health data types](https://developers.google.com/health/data-types)  
- [dailyRollUp](https://developers.google.com/health/reference/rest/v4/users.dataTypes.dataPoints/dailyRollUp)  
- [Sleep list filter](https://developers.google.com/health/reference/rest/v4/users.dataTypes.dataPoints/list)  
- ForgeRep evidence rule: `recovery_sleep` (7–9h target) in `@forgefit/evidence-kb`
