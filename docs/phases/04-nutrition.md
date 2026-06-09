# Phase 4 — Nutrition Diary

**Status:** Complete  
**Depends on:** Phase 3

## Goal

USDA + Open Food Facts search, daily macro diary, targets from evidence engine.

## Delivered

- [x] `@forgefit/nutrition-core` — parallel USDA + OFF search, macro scaling helpers
- [x] Migration `20260608300000_phase4_nutrition.sql` — `nutrition_logs` + RLS
- [x] `GET /api/nutrition/search?q=` — food lookup (< 1s with 300ms debounce + parallel fetch)
- [x] `GET/POST /api/nutrition/logs` — daily diary CRUD
- [x] `DELETE /api/nutrition/logs/[id]` — remove entry
- [x] Nutrition tab UI — macro progress vs program targets, search, log list

## Done When

- [x] Food search returns results < 1s
- [x] Daily macro summary matches logged entries
- [x] Protein/calorie targets match evidence rules for user goal (from active `ProgramPlan.nutrition`)

## Setup

1. Apply migration `20260608300000_phase4_nutrition.sql`
2. Optional: set `USDA_FDC_API_KEY` in `apps/web/.env.local` for USDA branded foods (OFF works without a key)
