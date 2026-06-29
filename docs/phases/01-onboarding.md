# Phase 1 — Auth + Onboarding

**Status:** Complete (2026-06-08)  
**Depends on:** Phase 0

## Goal

Supabase Auth, multi-step onboarding wizard, mobile bottom nav shell.

## Steps

1. Health disclaimer
2. Goal selection (fat loss, bodybuilding, powerlifting, strength, recomposition)
3. Experience level (beginner, intermediate, advanced)
4. About you (name, date of birth)
5. Body measurements (required + optional)
6. Body composition targets (fat-loss pace / recomp priority + optional goal weight — fat loss & recomp only)
7. Equipment inventory
8. Recovery equipment
9. Time budget (sessions/week × minutes)
10. "Why I started" (motivation field)
11. PWA install prompt

## DB Migrations

- `profiles` table with RLS
- `equipment_inventory`, `recovery_equipment`

## Done When

- [x] User can sign up / sign in (email + Google)
- [x] Onboarding collects first name, last name, and date of birth (age derived)
- [x] Onboarding saves complete profile
- [x] Bottom nav: Home, Workout, Nutrition, Progress, Community, Profile (Progress restored 2026-06-19)
- [x] Mobile layout at 375px passes visual review

## Routes Added

| Route | Purpose |
|-------|---------|
| `/login`, `/signup` | Auth |
| `/auth/callback` | OAuth handler |
| `/onboarding` | 11-step wizard |
| `/home`, `/workout`, `/nutrition`, `/progress`, `/profile` | App shell |

See [supabase-setup.md](../supabase-setup.md) for credentials.
