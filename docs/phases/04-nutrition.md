# Phase 4 — Nutrition Diary

**Status:** Complete  
**Depends on:** Phase 3

## Goal

USDA + Open Food Facts search, daily macro diary, targets from evidence engine.

## Delivered

- [x] `@forgefit/nutrition-core` — curated whole-foods library + macro scaling helpers (USDA/OFF search deprecated in UI, 2026-06-19)
- [x] Migration `20260608300000_phase4_nutrition.sql` — `nutrition_logs` + RLS
- [x] `GET /api/nutrition/search?q=` — legacy USDA + OFF lookup (removed from UI; whole-foods in-repo)
- [x] `GET/POST /api/nutrition/logs` — daily diary CRUD
- [x] `DELETE /api/nutrition/logs/[id]` — remove entry
- [x] `PATCH /api/nutrition/logs/[id]` — edit entry macros, name, meal slot (2026-06-28)
- [x] Nutrition tab UI — macro progress vs program targets, search, log list; Log tab optimized for fast manual macro entry (2026-06-19)
- [x] **Diary date picker** — view/log any day up to 90 days back via `?date=` (2026-06-28)
- [x] **Tier 1 diary UX** — meal slots, edit entries, log again, device favorites, quick log on diary home (2026-06-28)
- [x] **Tier 2 diary UX** — meal picker on all log paths, copy day on diary, custom foods, per-meal budget hints (2026-06-28)
- [x] **My Meals** library — saved meals with user-defined categories, ingredient line items, one-time log adjustments (localStorage; 2026-06-19)
- [x] Ingredient suggestion flow — users submit missing items from meal builder; stored in Supabase + optional email alert (2026-06-19)

## Done When

- [x] Food search returns results < 1s
- [x] Daily macro summary matches logged entries
- [x] Protein/calorie targets match evidence rules for user goal (from active `ProgramPlan.nutrition`)

## Setup

1. Apply migration `20260608300000_phase4_nutrition.sql`
2. Optional: set `USDA_FDC_API_KEY` in `apps/web/.env.local` for USDA branded foods (OFF works without a key)
