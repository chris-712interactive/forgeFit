# Phase 0 — Scaffold

**Status:** Complete (2026-06-08)  
**Depends on:** Nothing

## Goal

Monorepo, Next.js PWA shell, Forge Ember tokens, documentation skeleton, CI.

## Files to Create

- [x] Root `package.json`, `pnpm-workspace.yaml`, `turbo.json`
- [x] `apps/web` — Next.js 15 + Tailwind 4
- [x] `packages/ui` — Forge Ember tokens
- [x] `packages/evidence-kb` — 10 seed rules
- [x] `docs/BIBLE.md`, `PROGRESS.md`, `ARCHITECTURE.md`, `DESIGN.md`
- [x] `.cursor/rules/documentation-sync.mdc`, `forgefit-bible.mdc`
- [x] `.github/workflows/ci.yml`
- [x] `README.md`, `.env.example`
- [x] PWA icon (`icon.svg`)
- [x] `supabase/migrations/.gitkeep`

## Done When

- [x] `pnpm install` succeeds at root
- [x] `pnpm turbo typecheck` passes
- [x] `pnpm turbo build` passes
- [x] `pnpm --filter web dev` shows Forge Ember landing page
- [x] `manifest.json` served at `/manifest.json`
- [x] All phase files `00`–`08` exist
- [x] PROGRESS.md reflects Phase 0 complete
