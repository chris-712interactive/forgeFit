# ForgeRep vs MyFitnessPal — Differentiation Roadmap

> **Authoritative strategy doc** for product, marketing, and build prioritization when MFP is the comparison set.
> Complements [forgeRep-5-year-business-plan.md](../business/forgeRep-5-year-business-plan.md), [BIBLE.md](../BIBLE.md), and the live comparison article at `/guides/forgeRep-vs-myfitnesspal`.

**Last updated:** 2026-06-30

---

## Positioning

**One sentence:** ForgeRep is the evidence-based training + macro system for lifters who meal-prep and train offline — not a universal calorie database for everyone.

**ICP (primary):** 25–45, trains 3–5×/week, intermediate, has used MFP + a gym logger and wants **one integrated system**.

**Do not claim:** “Better MyFitnessPal.”  
**Do claim:** “Stop paying for MFP Premium while logging workouts somewhere else.”

---

## Where each product wins

| Dimension | MyFitnessPal | ForgeRep |
|-----------|--------------|----------|
| Food database / barcode | Industry-largest crowdsourced DB | Curated whole-foods + meal builder + custom foods |
| Workout programs | Not included | Evidence-based personalized plans (`program-engine`) |
| Gym logging | Basic calorie burn | Full offline active workout + progression |
| Macro targets | Generic calculator / manual | From goal, body comp pace, training volume |
| Projections | Weight chart | Weight trends + confidence bands + goal date |
| Offline gym UX | Weak | Core product requirement (Phase 3) |
| Tone / monetization | Ads on free; streak guilt common | Forge Ember — encourage without shame; generous free tier |

**Strategic rule:** Never compete head-on for “biggest food database.” Win the **integrated lifter loop**.

---

## Three differentiation pillars

### Pillar 1 — Unified loop (primary moat)

Training drives macro targets, progression, and projections — not a separate calorie-burn line item.

**User-visible loop:**
1. Onboarding → plan + macro targets
2. Workout tab → log session offline
3. Nutrition tab → hit protein with meal-prep workflow
4. Progress → projection moves; goal date updates

**Build principle:** Every major surface should answer *“Am I eating and training correctly for my goal?”* in one glance.

### Pillar 2 — Gym-first UX (MFP won’t prioritize)

- Offline PWA + Dexie sync
- Warm-up / work / recovery session structure
- RIR autoregulated progression
- Evidence explainer links on programming
- Equipment-aware substitutions

**Build principle:** Optimize set-logging speed, resume-in-progress, and basement-gym reliability — not MFP-style social feeds.

### Pillar 3 — Nutrition for how lifters eat

Shipped foundation (2026-06):
- Tier 1: meal slots, edit entries, log again, favorites, diary quick log, remaining macros highlight
- Tier 2: meal picker everywhere, copy yesterday, custom foods (“My foods”), per-meal budget hints
- Whole-foods library + meal builder (not barcode-first)

**Build principle:** “Cook at home, hit protein, log in 30 seconds” — not “scan every packaged food.”

---

## What not to build (differentiation killers)

| Trap | Why |
|------|-----|
| Full MFP-scale crowdsourced DB first | High cost, low margin, wrong moat |
| Barcode scanning as primary identity | Makes ForgeRep a worse MFP |
| Social/recipe ecosystem parity | 15-year head start; distraction |
| LLM-generated workouts | Fitbod lane; violates Bible |
| Nutrition-only marketing | MacroFactor owns “smart nutrition” cred |

**Acceptable bridges (switching tools, not identity):** selective barcode for staples, MFP CSV import, optional partner API if approved.

---

## Quarterly execution map

Assumes **Y1** = Jul 2026 – Jun 2027 (per business plan). Status as of 2026-06-30.

### Q3 2026 (Jul – Sep) — “Visible loop, good-enough diary”

**Theme:** Make the training ↔ nutrition connection obvious on Home and in copy.

| Priority | Initiative | Type | Success signal |
|:--:|------------|------|----------------|
| P0 | **Home integrated dashboard** — weekly training load + nutrition adherence + protein remaining on one card | Product | ↑ same-week workout + nutrition log rate | ✅ Shipped 2026-06-30 |
| P0 | **Post-workout → diary nudge** — “Log post-workout meal” with meal slot pre-selected | Product | ↑ nutrition logs within 2h of workout | ✅ Shipped 2026-06-30 |
| P1 | **Onboarding source question** — “Coming from MFP / Strong / other?” (optional, analytics only) | Product | Baseline switcher % | ✅ Shipped 2026-06-30 |
| P1 | **Comparison + guide traffic** — promote `/guides/forgeRep-vs-myfitnesspal`, macro-for-lifters guide | Marketing | Organic comparison-intent sessions |
| P1 | **Instagram loop clips** — offline workout + evidence + unified home (per 31-day calendar) | Marketing | Saves/shares on “one app” narrative |
| P2 | **Training-day copy on nutrition** — rest vs training day hint on macro summary (text-only OK) | Product | Qualitative “feels connected” feedback | ✅ Partial — Home train & fuel hints |
| P2 | **Complete Phase 7** — Withings QA, Strava launch, billing hardening | Product | Pro+ upsell path live |

**Explicitly defer:** full barcode search, Nutritionix menu API, MFP partner API (unless partnership email resolves).

---

### Q4 2026 (Oct – Dec) — “Switcher tools + Pro value MFP Premium can’t match”

**Theme:** Reduce friction for MFP refugees; deepen Pro.

| Priority | Initiative | Type | Success signal |
|:--:|------------|------|----------------|
| P0 | **Tier 3 nutrition (switching)** — see backlog below | Product | ↓ nutrition-tab-only churn | ✅ Shipped 2026-06-30 |
| P0 | **90-day projections + adherence analytics** — surface Pro value in upgrade moments | Product | Free→Pro conversion on projection lock | ✅ Shipped 2026-06-30 |
| P1 | **Pro+ restaurant quick-log polish** — saved meals, line items, eating-out workflow | Product | Pro+ retention; “MFP for eating out” replacement |
| P1 | **MFP export import (CSV)** — one-time diary migration | Product | Completed imports / new signups | ✅ Shipped 2026-06-30 |
| P2 | **Selective barcode / OFF** — packaged staples only (yogurt, protein bar, etc.) | Product | Barcode logs without DB sprawl | ✅ Shipped 2026-06-30 |
| P2 | **Landing page hero refresh** — lead with unified loop, not feature laundry list | Marketing | ↑ signup from comparison pages |
| P2 | **Email/onboarding drip** — “Day 3: log your first workout offline” | Marketing | D7 retention |

---

### Q1 2027 (Jan – Mar) — “Accountability + adaptive context”

**Theme:** Community and intelligence MFP doesn’t tie to training.

| Priority | Initiative | Type | Success signal |
|:--:|------------|------|----------------|
| P0 | **WACP community push** — opt-in rivals, weekly accountability prompts | Product | WACP opt-in ≥50% of Pro |
| P1 | **Training-volume-aware macro messaging** — deload week, missed session → target explanation | Product | Support tickets ↓; trust ↑ |
| P1 | **Goal reach date recalc** — body comp pace + adherence adjusts forecast (extend projection engine) | Product | Profile engagement; Pro stickiness |
| P2 | **Home logging streak** — nutrition + workout combined streak (no shame copy) | Product | D30 retention |
| P2 | **Case study content** — “I replaced MFP + Strong” user stories | Marketing | Conversion from guides |

---

### Q2 2027 (Apr – Jun) — “Category of one for integrated lifters”

**Theme:** Adaptive nutrition in training context (MacroFactor-adjacent, gym-integrated).

| Priority | Initiative | Type | Success signal |
|:--:|------------|------|----------------|
| P1 | **Expenditure drift vs plan** — compare scale trend to program-engine TDEE; neutral coaching copy | Product | Differentiation vs generic MFP calculator |
| P1 | **Stall detection → plan suggestions** — evidence-backed deload/volume tweak prompts | Product | Regeneration rate; adherence recovery |
| P2 | **Nutritionix menu search** — only if MAU/cost gate passes (business plan Y2 H2) | Product | Pro+ upsell |
| P2 | **Referral / crew invites v1** | Marketing | Viral coefficient baseline |
| P3 | **MFP partner API** — if partnership approved; else stay CSV + barcode bridge | Product | Switcher completion rate |

**Bible checkpoint:** ≥1,000 paying users mid–Y2 Q1 — messaging must stay ICP-sharp, not broad “calorie counter.”

---

## Product backlog (prioritized)

### Tier 3 nutrition — MFP switcher aids

| Item | Effort | Quarter | Notes |
|------|--------|---------|-------|
| Home nutrition ↔ training card | M | Q3 2026 | Pillar 1 flagship |
| Post-workout diary nudge | S | Q3 2026 | Deep link to nutrition + meal slot |
| Training-day macro hint copy | S | Q3 2026 | No engine change required v1 |
| MFP CSV import | M | Q4 2026 | ✅ Shipped — Browse tab panel + `/api/nutrition/import` |
| Selective barcode (OFF subset) | L | Q4 2026 | ✅ Shipped — `PackagedFoodPanel` + barcode API |
| Combined logging streak (Home) | S | Q1 2027 | Workout OR nutrition day counts — define rules |
| MFP partner API | L | Q2 2027+ | Blocked on partnership; optional |

*Effort: S = days, M = 1–2 weeks, L = multi-week*

### Pro / Pro+ — value MFP Premium cannot match

| Item | Effort | Quarter | Notes |
|------|--------|---------|-------|
| Projection lock → upgrade CTA | S | Q4 2026 | ✅ Shipped — progress dashboard copy when trend exists |
| 90-day projections surfacing | S | Q4 2026 | Pro tier |
| Adherence analytics bundle | M | Q4 2026 | ✅ Partial — 28-day nutrition milestone banner; full bundle Pro-gated |
| Restaurant quick-log + saved meals | M | Q4 2026 | Pro+ — partial today |
| Device integrations (Withings, Strava) | M | Q3 2026 | Pro+ — Phase 7 |

### Loop depth — engine + UX

| Item | Effort | Quarter | Notes |
|------|--------|---------|-------|
| Macro regen on plan regen messaging | S | Q3 2026 | Explain why targets changed |
| Goal reach date on profile | S | Shipped 2026-06 | Promote on Home |
| Deload / missed session target copy | M | Q1 2027 | `program-engine` + nutrition copy |
| Expenditure drift vs logged weight | L | Q2 2027 | Careful: MacroFactor comparison risk |
| Evidence-backed stall suggestions | L | Q2 2027 | Citations required |

---

## Go-to-market playbook

### Messaging matrix

| Audience | Message | Channel |
|----------|---------|---------|
| MFP + Strong jugglers | One app: program, macros, offline gym | Comparison SEO, Instagram |
| MFP Premium macro-only | Your targets should come from your training | Guide articles, email |
| Whole-food meal preppers | Build meals once, log in one tap | Nutrition UX demos |
| Returning lifters | Structure without shame | Forge Ember brand, onboarding |

### Content (live + planned)

| Asset | Status | Action |
|-------|--------|--------|
| `/guides/forgeRep-vs-myfitnesspal` | Live | Internal link from nutrition + workout pages |
| Macro tracking for lifters guide | Live | CTA to signup with loop screenshot |
| Instagram 31-day calendar | Live | Prioritize clips 4–6 (evidence, offline, unified) |
| “Replace MFP + Strong” case study | Planned Q1 2027 | User interview template |
| MFP CSV import help article | Planned Q4 2026 | Support + SEO |

### Upgrade moments (Free → Pro)

1. 30-day projection lock
2. Adherence analytics after 4 weeks of logging
3. Export / progress photos
4. Community opt-in preview on Home

MFP Premium equivalents (macro by meal, ad-free) are **not** our lead — lead with **training-linked intelligence**.

---

## Metrics dashboard

Track monthly. Segments: all users, “from MFP” (onboarding answer), nutrition-only WAU vs full-loop WAU.

| Metric | Definition | Q3 2026 target | Q4 2026 target |
|--------|------------|----------------|----------------|
| **Loop rate** | % WAU with ≥1 workout + ≥1 nutrition log same week | 35% | 45% |
| **Offline workout share** | Offline-started sessions / total sessions | 40% | 45% |
| **Nutrition-only churn** | 30-day churn among users with 0 workouts in 14d | Baseline | −20% vs baseline |
| **Switcher signups** | Onboarding “from MFP” % | Measure | 15%+ of new |
| **Comparison conversion** | Signups attributed to `/guides/*mfp*` | Measure | Top-3 guide source |
| **Free→Pro** | 30-day conversion | 6% | 8% |
| **Pro+ restaurant use** | Pro+ users logging restaurant quick-log / month | — | 25% of Pro+ |

**North star (differentiation):** *Weekly Active Loop Users* — users who both train and log nutrition in the same calendar week.

---

## Decision log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-30 | Ship Q4 switcher tools (MFP CSV, OFF barcode) + Pro upgrade moments | MFP differentiation roadmap execution |
| 2026-06-30 | Ship Q3 loop items (Home train & fuel, post-workout nudge, signup_source) | MFP differentiation roadmap execution |
| 2026-06-19 | Whole-foods library over USDA/OFF-at-scale | $0 ops cost; lifter workflow |
| 2026-06-28 | Tier 1 + 2 MFP-inspired diary UX | Parity on *workflow*, not database |
| 2026-06-30 | Document differentiation roadmap | Align build + marketing vs MFP |
| — | Barcode as bridge, not headline | Avoid becoming worse MFP |
| — | MFP partner API optional | CSV import first; partnership blocked |

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [BIBLE.md](../BIBLE.md) | Features, tiers, non-negotiables |
| [TIER-GATES.md](../TIER-GATES.md) | Pro / Pro+ gate matrix |
| [seo-guides.md](./seo-guides.md) | Article authoring |
| [comparison-articles.ts](../../apps/web/src/lib/seo/articles/comparison-articles.ts) | Live MFP comparison copy |
| [instagram-31-day-calendar.md](./instagram-31-day-calendar.md) | Social clip plan |
| [phases/04-nutrition.md](../phases/04-nutrition.md) | Nutrition acceptance criteria |
| [community-expansion-plan.md](../community-expansion-plan.md) | WACP roadmap |

---

## AI build handoff — start here

When picking up MFP-differentiation work, prefer this order:

1. ~~**Q3 P0:** Home integrated dashboard~~ ✅
2. ~~**Q3 P0:** Post-workout diary nudge~~ ✅
3. ~~**Q3 P1:** Onboarding “previous app” question~~ ✅
4. ~~**Q4 P0:** Tier 3 items (CSV import, then selective barcode)~~ ✅
5. ~~**Q4 P0:** Pro upgrade moments on projection/adherence~~ ✅
6. **Q3 P1:** Comparison + guide traffic (marketing)
7. **Q4 P1:** Pro+ restaurant quick-log polish

Update this doc’s decision log and quarter tables when priorities shift. Update [PROGRESS.md](../PROGRESS.md) after each shipped initiative.
