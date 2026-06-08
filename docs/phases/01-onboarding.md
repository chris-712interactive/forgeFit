# Phase 1 — Auth + Onboarding

**Status:** Pending  
**Depends on:** Phase 0

## Goal

Supabase Auth, multi-step onboarding wizard, mobile bottom nav shell.

## Steps

1. Goal selection (fat loss, bodybuilding, powerlifting, strength, recomposition)
2. Experience level (beginner, intermediate, advanced)
3. Body measurements (required + optional)
4. Equipment inventory
5. Recovery equipment
6. Time budget (sessions/week × minutes)
7. "Why I started" (motivation field)

## DB Migrations

- `profiles` table with RLS
- `equipment_inventory`, `recovery_equipment`

## Done When

- [ ] User can sign up / sign in (email + Google)
- [ ] Onboarding saves complete profile
- [ ] Bottom nav: Home, Workout, Nutrition, Progress, Profile
- [ ] Mobile layout at 375px passes visual review
