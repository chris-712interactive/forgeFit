# Phase 6 — Exercise Library UI

**Status:** Complete  
**Depends on:** Phase 5

## Goal

500+ exercise DB, GIF viewer, body-highlighter muscle activation.

## Done When

- [x] Exercise detail shows GIF + muscle heatmap
- [x] Equipment substitution preview works
- [x] GIFs cached for offline (service worker)

## Delivered

- [x] 873-exercise catalog imported from [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (`packages/exercise-db/data/catalog.json`)
- [x] `searchCatalog()`, `resolveExerciseDetail()`, `getSubstitutions()` in `@forgefit/exercise-db`
- [x] `/exercises` library with search + movement/muscle filters
- [x] `/exercises/[id]` detail — frame animation, `react-body-highlighter` muscle map, equipment swaps
- [x] Active workout exercise names link to detail pages
- [x] Serwist `CacheFirst` for `raw.githubusercontent.com/.../free-exercise-db/` media

## Verify

1. Open `/exercises` from Home or Profile
2. Search “squat” → open an exercise → demo frames animate
3. Muscle heatmap highlights primary movers
4. Equipment swaps list alternatives for your inventory
5. View an exercise once online, toggle offline — demo image still loads from cache
