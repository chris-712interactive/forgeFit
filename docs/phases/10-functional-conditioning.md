# Phase 10 — Functional Conditioning

**Status:** In progress (10A MVP shipped in this slice)  
**Depends on:** Phases 1–2 (onboarding, evidence engine, program engine), functional movement bias (2026-06-30)

## Goal

Add a **Functional conditioning** primary goal — mixed-modal strength + metabolic conditioning — without using the CrossFit® trademark or implying affiliation.

Users get **hybrid weekly plans**: compound strength days plus dedicated **conditioning circuits** that maximize training time. Program logic stays in `program-engine` + `evidence-kb` only.

---

## Locked product decisions

| Decision | Choice |
|----------|--------|
| User-facing name | **Functional conditioning** (never “CrossFit” in UI or marketing) |
| Internal enum | `functional_conditioning` |
| Weekly mix | Mostly strength-pattern days + 1–2 conditioning days (scales with `sessions_per_week`) |
| Conditioning format (10A) | **Fixed rounds** circuit; AMRAP in 10B |
| Age gate | **13+** (same as general strength) |
| Nutrition | Same surplus band as `general_strength` |
| Secondary goal | Not available as hybrid secondary in v1 |

---

## Slices

| Slice | Scope | Status |
|-------|-------|--------|
| **10A** | Goal enum, onboarding, engine splits, fixed-round conditioning blocks, workout logging | ✅ (this session) |
| **10B** | AMRAP / time-cap presets, conditioning finisher option on other goals | ⏳ |
| **10C** | Dedicated landing page + SEO (“functional conditioning app”) | ⏳ |

---

## 10A — MVP

### Database

| Migration | Notes |
|-----------|-------|
| `20260630140000_functional_conditioning_goal.sql` | Adds `functional_conditioning` to `fitness_goal` enum — **run alone** (PG enum rule) |

### Program engine

| File | Change |
|------|--------|
| `types.ts` | `ConditioningBlock`, `ConditioningMovement`, optional on `WorkoutSession` |
| `conditioning.ts` | Build circuits from movement patterns + equipment |
| `splits.ts` | `functional_conditioning` weekly templates (`sessionType: strength \| conditioning`) |
| `generate.ts` | Branch `buildConditioningSession` when template is conditioning |
| `functional.ts` | High functional bias, 3 compound floor on strength days |
| `nutrition.ts` | Treat like `general_strength` for calories |

### Evidence KB

| Rule ID | Purpose |
|---------|---------|
| `functional_conditioning_hybrid_split` | Documents strength + conditioning mix |
| `functional_conditioning_rounds` | Round count caps by experience / session length |
| `functional_movement_priority_strength` | Extended to include `goal:functional_conditioning` |

### Workout UX

| Component | Change |
|-----------|--------|
| `workout-steps.ts` | `conditioning` step when `conditioningBlock` present |
| `conditioning-block-card.tsx` | List movements, log rounds, rest hint |
| `active-workout.tsx` | Render conditioning step |
| `workout-phase-cards.tsx` | Preview conditioning on card flip |
| `offline-sync` | `conditioningBlock` + status on local session |

### Onboarding & profile

- New goal card: **Functional conditioning** — “Strength plus circuits — get more done in less time”
- Profile → Program plan goal dropdown includes new value
- Regenerate respects new splits

---

## Acceptance criteria (10A done when)

- [ ] Migration applied; `functional_conditioning` selectable in onboarding
- [ ] Generated plan includes ≥1 conditioning session with `conditioningBlock` (rounds + movements)
- [ ] Strength days use compound patterns with high functional bias
- [ ] Active workout logs conditioning rounds offline
- [ ] Phase preview shows conditioning movements
- [ ] No “CrossFit” string in user-facing copy
- [ ] `pnpm exec tsc --noEmit` in `apps/web` passes
- [ ] Engine tests for splits + conditioning builder pass

---

## Legal / naming note

**CrossFit®** is a registered trademark. ForgeRep uses generic terms: functional conditioning, metabolic conditioning, circuit training, mixed-modal. Do not use CrossFit logos, Box™ language, or suggest official partnership.

---

## Key files

| Area | Paths |
|------|-------|
| Phase doc | `docs/phases/10-functional-conditioning.md` |
| Engine | `packages/program-engine/src/conditioning.ts`, `splits.ts`, `generate.ts` |
| Migration | `supabase/migrations/20260630140000_functional_conditioning_goal.sql` |
| Onboarding | `apps/web/src/lib/constants/onboarding.ts` |
| Workout UI | `apps/web/src/components/workout/conditioning-block-card.tsx` |
