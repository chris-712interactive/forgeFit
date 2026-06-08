# Phase 1 — Auth + Onboarding

**Status:** Complete (2026-06-08)  
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

- [x] User can sign up / sign in (email + Google)
- [x] Onboarding saves complete profile
- [x] Bottom nav: Home, Workout, Nutrition, Progress, Profile
- [x] Mobile layout at 375px passes visual review

## Routes Added

| Route | Purpose |
|-------|---------|
| `/login`, `/signup` | Auth |
| `/auth/callback` | OAuth handler |
| `/onboarding` | 7-step wizard |
| `/home`, `/workout`, `/nutrition`, `/progress`, `/profile` | App shell |

See [supabase-setup.md](../supabase-setup.md) for credentials.
