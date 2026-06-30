# Phase 9 — Youth & Sport Performance

**Status:** In progress (9A + 9B shipped)  
**Depends on:** Phases 1–2 (onboarding, evidence engine, program engine)

## Goal

Make ForgeRep accessible and useful for users **13+**, with **sport-first onboarding** (all ages), optional **hybrid physique goals**, **parent sign-off for ages 13–15**, and foundations for **teen-only community** (18+ adult cohort) in later slices.

Program logic remains in `program-engine` + `evidence-kb` only — never LLM-generated workouts.

---

## Locked product decisions

| Decision | Choice |
|----------|--------|
| Hybrid goals | Optional `secondary_goal` when primary is `sport_performance` |
| Community cohort | Teen leagues for age **&lt; 18**; adult at **18+** (slice 9G) |
| Parent sign-off | Required for ages **13–15** (under 16) |
| Sport catalog scope | US school/club sports first; female-specific entries where demands differ |
| Sport onboarding | Available to **all ages 13+**, not youth-only |

---

## Slices

| Slice | Scope | Status |
|-------|-------|--------|
| **9A** | Age policy module, US sport catalog, DB migration, shared types | ✅ |
| **9B** | Onboarding: sport path, secondary goal, parent step, age-gated physique goals | ✅ |
| **9C** | Evidence rules: youth LTAD, in-season volume, sport demand profiles | ⏳ |
| **9D** | Engine: sport splits + position modifiers (6 sports MVP) | ⏳ |
| **9E** | Season phase volume + hybrid secondary nutrition | ⏳ |
| **9F** | Profile settings: edit sport / season / secondary | ⏳ |
| **9G** | Teen community cohort + parent-consent gate for community | ⏳ |
| **9H** | Expand catalog (+ wrestling, swim, cheer, lacrosse, track sub-events) | ⏳ |

---

## 9A — Foundation

### Age policy (`packages/program-engine/src/age-policy.ts`)

| Export | Purpose |
|--------|---------|
| `resolveAgeBand(age)` | `youth_13_15` · `teen_16_17` · `young_adult_18_22` · `adult_23_plus` |
| `resolveAgeCohort(age)` | `teen` if &lt; 18, else `adult` (community) |
| `requiresParentConsent(age)` | `true` for ages 13–15 |
| `isPrimaryGoalAllowedForAge` | Blocks powerlifting &lt; 16, recomp/bodybuilding &lt; 15 |
| `isSecondaryGoalAllowedForAge` | Same physique gates for hybrid path |
| `isFatLossPaceAllowedForAge` | Aggressive 18+; moderate 16+ |
| `capExperienceForAge` | Advanced → intermediate when age &lt; 16 |
| `maxSessionsPerWeekForAge` / `maxMinutesPerSessionForAge` | Youth caps |

### Sport catalog (`packages/evidence-kb/data/sports-catalog.json`)

Versioned US catalog with categories, sports, optional positions, season phases. Female-specific IDs where programming differs (`softball`, `field_hockey`, `competitive_cheer`, etc.).

Runtime loader: `packages/evidence-kb/src/sports-catalog.ts`.

### Database (`supabase/migrations/20260630110000_youth_sport_onboarding.sql`)

| Column | Type | Notes |
|--------|------|-------|
| `primary_goal` | + `sport_performance` enum value | |
| `sport_id` | text | Catalog id |
| `sport_position_id` | text | Nullable |
| `sport_season_phase` | enum | `in_season` · `off_season` · `general_prep` |
| `secondary_goal` | fitness_goal | Nullable; not `sport_performance` |
| `parent_consent_at` | timestamptz | Required when age 13–15 |
| `parent_consent_name` | text | |
| `parent_consent_email` | text | |

---

## 9B — Onboarding UX

### Flow (dynamic steps)

1. Health disclaimer (+ youth addendum)
2. Goal lane — **Sport performance** or physique/strength goals (age labels; validated after DOB)
3. **Sport path:** category → sport → position (if applicable) → season phase → optional secondary goal
4. Experience
5. About you (DOB)
6. **Parent sign-off** (ages 13–15 only)
7. Measurements → body comp → equipment → recovery → time → why → finish

### Age gates (UI + server)

| Option | Min age |
|--------|---------|
| Sport performance | 13 |
| General strength | 13 |
| Fat loss | 13 (pace gated) |
| Recomposition | 15 |
| Bodybuilding | 15 |
| Powerlifting | 16 |
| Aggressive fat-loss pace | 18 |
| Moderate fat-loss pace | 16 |

### Interim program behavior

Until slice **9D**, `sport_performance` uses the **general strength** template in `program-engine` with sport metadata stored on profile. Nutrition follows general-strength maintenance targets.

---

## 9G preview (not in 9A/9B)

- Community bucket key: `${goal}:${experience}:${age_cohort}` where `age_cohort` is `teen` | `adult`
- Users 13–15 without `parent_consent_at` may train but **community opt-in blocked** until consent recorded

---

## Done when (full phase)

- [x] 9A: age policy tested; catalog loads; migration applied
- [x] 9B: sport onboarding path; parent step 13–15; server rejects invalid goal/pace for age
- [ ] 9C: ≥15 new evidence rules with citations for youth + sport
- [ ] 9D: Generated plans differ by sport + position (6 sports)
- [ ] 9E: In-season volume reduction + secondary goal nutrition
- [ ] 9F: Profile settings regenerate with sport fields
- [ ] 9G: Teen-only leaderboards; parent gate on community
- [ ] 9H: Catalog ≥20 US sports

---

## Key files

| Area | Paths |
|------|-------|
| Phase doc | `docs/phases/09-youth-sport.md` |
| Age policy | `packages/program-engine/src/age-policy.ts` |
| Catalog | `packages/evidence-kb/data/sports-catalog.json`, `src/sports-catalog.ts` |
| Migration | `supabase/migrations/20260630110000_youth_sport_onboarding.sql` |
| Onboarding | `apps/web/src/components/onboarding/*`, `lib/onboarding/steps.ts` |
| Server | `apps/web/src/app/actions/onboarding.ts` |

---

## Parent sign-off (legal note)

US COPPA requires verifiable parental consent for **under 13** (blocked by app minimum age). Ages **13–15** parent acknowledgment is a **product policy** aligned with common 13–15 / 16–17 regulatory tiers — not a federal mandate at exactly 16. Consult counsel before adding email verification flows.
