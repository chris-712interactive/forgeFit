# ForgeRep — 5-Year Business Plan

> **Printable / mobile:** [forge-rep.com/docs/business/5yr](https://forge-rep.com/docs/business/5yr) — open on phone or desktop → Print (⌘P). Regenerate from markdown: `node docs/business/generate-pdf.mjs --html-only`

**Prepared:** June 25, 2026  
**Horizon:** July 2026 – June 2031  
**Product:** [ForgeRep](https://forge-rep.com) — evidence-based fitness & nutrition PWA  
**Status:** Product largely built (Phases 0–6, 8 complete; Phase 7 billing/integrations partial)

---

## Executive summary

ForgeRep is a mobile-first, offline-capable fitness platform that connects **evidence-based programming**, **macro tracking**, **progress projections**, and **accountability** in one app. Unlike generic workout generators or calorie counters, ForgeRep’s program logic is deterministic and citation-backed — a defensible moat in a market saturated with hype-driven tools.

This plan translates the goals in our authoritative product docs (`docs/BIBLE.md`, `docs/TIER-GATES.md`, `docs/ADRs/001-tier-pricing-margins.md`, `docs/marketing/instagram-31-day-calendar.md`, `docs/community-expansion-plan.md`) into a **five-year path to ~$11M ARR**, **80,000 paying subscribers**, and **sustainable profitability** — without venture-scale burn.

**North-star outcomes by Year 5:**

| Metric | Target |
|--------|--------|
| Registered users | 500,000 |
| Paying subscribers | 80,000 (16% of registered) |
| Monthly recurring revenue (MRR) | ~$950,000 |
| Annual recurring revenue (ARR) | ~$11.4M |
| Blended ARPU (paying) | ~$11.90/mo |
| Gross margin (blended) | ≥85% |
| EBITDA margin | ≥15% |

**Strategic thesis:** Win on **trust + retention**, not feature breadth. Free tier delivers a complete training loop; Pro/Pro+ monetize long-horizon intelligence, community accountability, and device automation — all with 82–94% contribution margins per ADR 001.

---

## 1. Company overview

### 1.1 Mission

Help people train with intention — programs, nutrition, and progress grounded in peer-reviewed evidence, not Instagram trends.

### 1.2 Vision (2031)

ForgeRep is the default **accountability layer** for serious recreational lifters: the app you open before every set, that works when the gym has no signal, and that shows you — with data — whether you’re on pace for your goal.

### 1.3 What exists today

| Area | Status |
|------|--------|
| Auth, onboarding, evidence-based programs | Shipped |
| Offline workout logging (PWA + Dexie) | Shipped |
| Nutrition diary + saved meals | Shipped |
| Projections, analytics, caliper BF% | Shipped |
| Stripe billing (Free / Pro / Pro+) | Shipped |
| Fitbit/Google Health sync | Shipped (Pro+) |
| Community (leaderboards, rivals, crews, leagues) | Shipped (Pro) |
| Spotify workout music | Shipped (all tiers) |
| Withings, Strava | Code ready; launch prioritized in Phase 7 |

**MVP success criteria (from BIBLE):** onboarding → first workout &lt;10 min; offline sync integrity; Lighthouse PWA ≥90; evidence KB ≥30 citations — all met or on track.

### 1.4 Business model

Three-tier freemium (see `docs/TIER-GATES.md`):

| Tier | Price | Role in funnel |
|------|-------|----------------|
| **Free** | $0 | Acquisition — full training loop, 30-day projections |
| **Pro** | $8.99/mo · $69.99/yr | Core monetization — analytics, community, 90-day projections |
| **Pro+** | $14.99/mo · $119.99/yr | Premium — integrations, AI coaching, restaurant quick-log |

**Target mix (steady state):** 55% Pro annual · 25% Pro monthly · 12% Pro+ annual · 8% Pro+ monthly → **blended ~$11.90/mo ARPU**.

---

## 2. Market opportunity

### 2.1 TAM / SAM / SOM

| Layer | Definition | Estimate |
|-------|------------|----------|
| **TAM** | Global fitness app market | ~$10B+ (2026) |
| **SAM** | English-speaking serious lifters who track macros + programs | ~25M |
| **SOM (Year 5)** | Achievable share via organic + paid + community loops | 500K registered · 80K paying |

### 2.2 Target customer (ICP)

**Primary:** 25–45, gym-goer, intermediate experience, trains 3–5×/week, has tried MyFitnessPal or Strong but wants **one integrated system** with offline reliability.

**Secondary:** Returning lifters after a break who need structure without shame-based UX.

**Not targeting (Year 1–3):** CrossFit boxes, enterprise corporate wellness, clinical/medical weight management.

### 2.3 Competitive positioning

| Competitor | Weakness ForgeRep exploits |
|------------|---------------------------|
| MyFitnessPal | Nutrition-only; no evidence-based programming |
| Strong / Hevy | Logging-only; no macro/program integration |
| Fitbod / AI generators | Opaque “AI workouts”; no citations |
| MacroFactor | Strong nutrition science; weaker offline gym UX & community |

**ForgeRep differentiators:** offline-first PWA · evidence KB · program + macros + projections unified · Pro community accountability (WACP north star) · warm “Forge Ember” brand that encourages without shaming.

---

## 3. Five-year financial model

### 3.1 Revenue trajectory

Assumptions: 8–12% free→paid conversion ramp; 4–6% monthly churn on monthly plans; 2–3× longer retention on annual (per ADR 001); 65→80% annual billing mix over 5 years.

| Year | Period | Registered | Paying | MRR | ARR |
|------|--------|------------|--------|-----|-----|
| **Y1** | Jul 2026 – Jun 2027 | 5,000 | 500 | $6,000 | $72K |
| **Y2** | Jul 2027 – Jun 2028 | 25,000 | 3,000 | $36,000 | $432K |
| **Y3** | Jul 2028 – Jun 2029 | 80,000 | 12,000 | $130,000 | $1.56M |
| **Y4** | Jul 2029 – Jun 2030 | 200,000 | 35,000 | $400,000 | $4.8M |
| **Y5** | Jul 2030 – Jun 2031 | 500,000 | 80,000 | $950,000 | $11.4M |

**Bible reference checkpoint:** 1,000 paying users at ~$12/mo = ~$12K MRR — targeted **mid–Year 2 (Q1 2028)**.

### 3.2 Unit economics (steady state)

From ADR 001:

| Tier | Contribution margin | Notes |
|------|---------------------|-------|
| Pro (annual) | ~94% | No paid APIs; lead with annual in upgrade UI |
| Pro (monthly) | ~92% | Higher Stripe fee drag |
| Pro+ (annual) | ~82% | Device APIs + AI coaching ~$1.50/mo variable |

**LTV targets (blended paying user):**

| Scenario | Monthly churn | Avg life | LTV |
|----------|---------------|----------|-----|
| Monthly-heavy | 5% | 20 mo | ~$200 |
| Annual-heavy (goal) | 2.5% effective | 40 mo | ~$420 |

**CAC guardrails:**

| Channel | Target CAC | Max CAC (LTV/3) |
|---------|------------|-----------------|
| Organic / content | $0–15 | — |
| Influencer / affiliate | $25–40 | $140 |
| Paid social (Y3+) | $45–65 | $140 |

Do not scale paid until **90-day retention ≥40%** and **free→paid ≥8%**.

### 3.3 Cost structure

| Category | Y1 | Y3 | Y5 |
|----------|----|----|-----|
| Infra (Vercel, Supabase, APIs) | $3K/yr | $45K/yr | $180K/yr |
| AI coaching (Pro+ only) | $500/yr | $18K/yr | $60K/yr |
| Marketing | $12K/yr | $180K/yr | $850K/yr |
| Contractor / part-time | $24K/yr | $120K/yr | $400K/yr |
| Full-time team | $0 | $180K/yr | $1.2M/yr |
| **Total opex** | **~$40K** | **~$543K** | **~$2.69M** |
| **EBITDA** | **~$32K** | **~$1.0M** | **~$1.7M (~15%)** |

Infra scales per BIBLE: ~$25–50/mo at 0–500 users → ~$800/mo at 1,000 paying → Terra/unified integrations at 1,000+ paying users.

---

## 4. Year-by-year operating plan

### Year 1 — Launch & prove product–market fit (Jul 2026 – Jun 2027)

**Goal:** 5,000 registered · 500 paying · $6K MRR · validate retention loops.

#### Q3 2026 (Launch quarter)

| Initiative | Specific actions | Success metric |
|------------|------------------|----------------|
| **Public launch** | Ship production billing; finish Withings QA; launch Strava sync | Checkout success ≥98% |
| **Instagram 31-day calendar** | Execute `docs/marketing/instagram-31-day-calendar.md` end-to-end | 5–10 signups/week by Week 4 |
| **Content factory** | Batch screen recordings (Day 0); 15-min Reel factory; cross-post TikTok/Shorts | 2K+ Reel views Week 4 |
| **Onboarding funnel** | Hit BIBLE metric: first workout &lt;10 min; PWA install prompt post-onboarding | ≥60% D1 activation |
| **ForgeRep Spotify playlists** | Replace interim playlist IDs with brand-owned lists | Music picker engagement ≥30% of sessions |

#### Q4 2026

| Initiative | Specific actions | Success metric |
|------------|------------------|----------------|
| **Community activation** | Default-on A/B (`COMMUNITY_OPT_IN_AB_ENABLED`); weekly recap emails via Resend | WACP ≥25% of Pro users |
| **Annual plan push** | Default upgrade UI to annual (ADR 001); “2 months free” messaging | ≥50% new subs on annual |
| **Micro-influencer collabs** | DM 5 accounts/week (1–10K followers); free Pro for honest Reel | 2 collab posts/month |
| **Referral v1** | “Give a month, get a month” Pro credit (Stripe coupon) | 10% of signups referred |

#### H1 2027

| Initiative | Specific actions | Success metric |
|------------|------------------|----------------|
| **Retention instrumentation** | Cohort dashboards: D7/D30/D90, workout frequency, macro adherence | D30 retention ≥35% |
| **SEO foundation** | Landing pages per goal type (fat loss, powerlifting, etc.) | 500 organic visits/mo |
| **App Store narrative** | “Add to Home Screen” guides; iOS PWA install content | PWA install rate ≥20% mobile |
| **Support loop** | In-app feedback → weekly fix batch | NPS ≥40 |

#### H2 2027

| Initiative | Specific actions | Success metric |
|------------|------------------|----------------|
| **Pro+ integration bundle** | Market Fitbit + Withings + Strava as “autopilot progress” | Pro+ ≥25% of paid base |
| **Saved meals & restaurant log** | Ship line-item logging; curated restaurant quick-log (Pro+) | Pro+ upgrade +15% |
| **First revenue milestone** | — | **500 paying · $6K MRR** |

**Y1 marketing budget:** $12K (tools, Canva Pro, modest boosted posts, giveaway prizes).

---

### Year 2 — Scale acquisition & deepen retention (Jul 2027 – Jun 2028)

**Goal:** 25,000 registered · 3,000 paying · $36K MRR · **hit Bible 1,000-paying / $12K MRR milestone in Q1**.

#### Growth engine

| Channel | Tactics | Y2 contribution |
|---------|---------|-----------------|
| **Organic social** | 2 Reels/day cadence; myth-vs-fact carousels; hook bank rotation | 40% of signups |
| **YouTube** | “Evidence explained” 8-min videos; link to goal-specific landing pages | 15% |
| **Reddit / forums** | Value-first posts in r/fitness, r/weightroom (no spam) | 10% |
| **Affiliate / creators** | 20% rev-share for fitness YouTubers 10K–100K subs | 20% |
| **Paid test** | $2K/mo Meta/TikTok once LTV proven | 15% |

#### Product priorities

1. **Community as retention:** Crew challenges, league promotions, Sunday push nudges — target **WACP ≥40%** of Pro opt-in users.
2. **Upgrade triggers:** Gate 90-day projections behind Pro at moment of insight (“See your goal date → upgrade”).
3. **Email lifecycle:** Onboarding drip (days 1, 3, 7, 14); win-back at day 30 inactive.
4. **Nutritionix-class menu search** — defer until MAU × margin supports ~$6K/yr vendor minimum (ADR 001).

#### Org

- Hire **part-time content creator** (contract, $2K/mo).
- Hire **customer success / community mod** (contract, 10 hrs/wk).

**Y2 checkpoint:** 3,000 paying · $36K MRR · D90 retention ≥30% · CAC &lt;$40 blended.

---

### Year 3 — Paid scale & partnership channel (Jul 2028 – Jun 2029)

**Goal:** 80,000 registered · 12,000 paying · $130K MRR (~$1.56M ARR).

#### Scale paid acquisition

| Rule | Threshold |
|------|-----------|
| Turn on paid | LTV/CAC ≥3 over 90-day cohort |
| Budget ramp | Start $5K/mo → $15K/mo by Q4 |
| Creative | UGC-style gym demos; offline hook; projection reveal |
| Landing | Goal-specific pages with social proof |

#### B2B2C pilot — “ForgeRep for Coaches”

| Element | Detail |
|---------|--------|
| Offer | Coach dashboard: client adherence, macro compliance, volume trends |
| Pricing | $29/mo per coach + 5 clients; $5/additional client |
| Pilot | 25 coaches × 8 clients avg = 200 incremental users |
| Distribution | Instagram DMs to online coaches; r/personaltraining |

#### Infrastructure

- Migrate wearables to **Terra API** at 1,000+ paying (per BIBLE cost model).
- Launch **full restaurant menu search** (Pro+) when revenue supports API minimum.
- **Apple Sign-In** polish for iOS PWA retention.

#### Team

- First **full-time engineer** (integrations + mobile PWA polish).
- **Growth marketer** (paid + SEO).

**Y3 checkpoint:** $130K MRR · paid channel ≤35% of CAC · coach pilot ≥100 paying coach seats.

---

### Year 4 — Category leadership & geo expansion (Jul 2029 – Jun 2030)

**Goal:** 200,000 registered · 35,000 paying · $400K MRR (~$4.8M ARR).

#### Product expansion

| Initiative | Rationale |
|------------|-----------|
| **Coach white-label tier** | Gyms and influencers want branded experience |
| **Advanced periodization** | Powerlifting peaking blocks; bodybuilding mesocycles |
| **Apple Music / MusicKit** | Only if user demand warrants (spotify-integration-plan ADR path) |
| **Native app evaluation** | Build iOS/Android only if PWA install rate caps growth at &lt;25% |

#### Geographic expansion

1. **UK, Canada, Australia** — metric/imperial already supported; localize currency in Stripe.
2. **Compliance** — GDPR export/delete already built; add cookie banner for EU traffic.

#### Brand & PR

- Podcast tour (10 appearances): evidence-based fitness angle.
- **Case study program:** 50 users, 12-week transformation, cited methodology.
- App Store / Product Hunt relaunch when native or PWA install flow improves.

#### Team (8–12 FTE)

Engineering (3) · Growth (2) · Content (2) · Support/Community (1) · Founder/PM (1) · Part-time finance/legal.

**Y4 checkpoint:** $400K MRR · coach channel ≥15% of new subs · international ≥20% of registered.

---

### Year 5 — Profitability & strategic optionality (Jul 2030 – Jun 2031)

**Goal:** 500,000 registered · 80,000 paying · $950K MRR (~$11.4M ARR) · **EBITDA ≥15%**.

#### Maturity moves

| Pillar | Actions |
|--------|---------|
| **Retention** | Annual plan ≥75%; loyalty pricing for 2-year commits; churn prediction model |
| **Expansion revenue** | Pro+ upsell from integration attach; AI coaching personalization |
| **Enterprise** | Corporate wellness pilot (50–500 employees); SSO |
| **Data moat** | Anonymized adherence benchmarks (“lifters like you hit protein 73% of days”) |

#### Strategic options

1. **Independent growth** — reinvest EBITDA into content + product; target $20M ARR Y6.
2. **Strategic acquisition** — fitness media, supplement brands, or wearable companies seeking software layer.
3. **Raise growth round** — only if paid channels at scale with proven unit economics.

**Y5 checkpoint:** $950K MRR · EBITDA positive · gross margin ≥85% · NPS ≥50.

---

## 5. Go-to-market playbook (how we hit the numbers)

### 5.1 Acquisition funnel

```
Awareness (Reels, SEO, collabs)
    ↓
Signup (free — forge-rep.com/signup?utm_*)
    ↓
Activation (first workout <10 min — BIBLE metric)
    ↓
Habit (3 workouts in 14 days)
    ↓
Conversion (projection insight, community preview, 90-day lock)
    ↓
Retention (community WACP, annual plan, integrations)
    ↓
Expansion (Pro → Pro+, coach seats, referrals)
```

### 5.2 Conversion triggers (product-led growth)

| Moment | Upgrade prompt |
|--------|----------------|
| Day 30 projection ends | “Unlock 90-day forecast + goal date” → Pro |
| 4th workout in a week | Community opt-in preview → Pro |
| Manual weight log ×7 | “Auto-sync Withings/Fitbit” → Pro+ |
| Macro streak 7 days | Nutrition adherence dashboard → Pro |
| PR logged | Celebration modal + export → Pro / Pro+ |

### 5.3 Content strategy (from Instagram calendar)

| Content pillar | % of feed | Purpose |
|----------------|-----------|---------|
| Education (myth vs fact) | 30% | Saves, authority, SEO snippets |
| App demo / feature | 30% | Conversion |
| Motivation / accountability | 25% | Shares, community identity |
| Social proof / wins | 15% | Trust |

**Weekly metrics (new account targets from calendar):**

| Metric | Week 2 | Week 4 |
|--------|--------|--------|
| Reel views | 500+ | 2,000+ |
| Signups | 5–10/week | 20–40/week (Y1 avg) |

### 5.4 Community as growth loop (WACP north star)

From `docs/community-expansion-plan.md`:

**WACP** = Pro users who opt in *and* take ≥1 community action/week.

| Year | Pro opt-in rate | WACP / opt-in | Why it matters |
|------|-----------------|---------------|----------------|
| Y1 | 30% | 50% | Prove accountability reduces churn |
| Y3 | 45% | 60% | Viral wins feed + crew invites |
| Y5 | 55% | 70% | Community-driven referrals ≥25% of signups |

**Tactics:** weekly recap email (shipped); Sunday push nudge (shipped); crew invite links; shareable weekly recap card; league promotion notifications.

---

## 6. Key metrics dashboard

### 6.1 Weekly operating metrics

| Metric | Y1 target | Y5 target |
|--------|-----------|-----------|
| New signups | 100/wk → 200/wk | 2,000/wk |
| Free → paid conversion (30d) | 8% | 12% |
| Monthly churn (paying) | &lt;6% | &lt;4% |
| Annual plan mix | 50% | 75% |
| D30 retention (registered) | 35% | 45% |
| Workouts logged / WAU | 2.5 | 3.2 |
| WACP / Pro opt-in | 50% | 70% |
| NPS | 40 | 50 |
| App store / PWA install rate | 20% | 35% |

### 6.2 Milestone gates (kill or scale decisions)

| Gate | Pass | Fail action |
|------|------|---------------|
| Month 6 | ≥200 paying | Revise ICP messaging; double content cadence |
| Month 12 | ≥500 paying, D30 ≥35% | Pause paid; fix activation funnel |
| Month 18 | ≥1,000 paying (Bible ref) | Evaluate niche pivot (powerlifting-only?) |
| Month 24 | ≥3,000 paying, LTV/CAC ≥3 | Do not raise; stay lean |
| Month 36 | ≥$100K MRR | Hire growth lead; open paid channels |

---

## 7. Product roadmap alignment

Maps to `docs/BIBLE.md` phases + post-MVP initiatives:

| Timeline | Product | Business impact |
|----------|---------|-----------------|
| Y1 Q3 | Complete Phase 7 (Withings, Strava, billing hardening) | Pro+ differentiation |
| Y1 Q4 | Nutrition line items + saved meals quick-log | Pro+ retention |
| Y2 H1 | Coach dashboard MVP | New B2B2C revenue |
| Y2 H2 | Nutritionix menu search (when MAU supports) | Pro+ upsell |
| Y3 | Terra unified integrations | Lower eng cost at scale |
| Y3 | Referral program v2 (crew-based invites) | Viral coefficient ≥0.15 |
| Y4 | White-label coach tier | $29–99/mo ARPU expansion |
| Y4–5 | Native app (if data supports) | iOS discovery, push reliability |
| Y5 | Enterprise wellness | $5–15/employee/mo |

**Non-negotiables (BIBLE AI rules):** program logic never LLM-generated; evidence KB citations required; offline workout logging mandatory; Forge Ember design tokens only.

---

## 8. Team & organization

### 8.1 Hiring plan

| Year | Headcount | Key roles |
|------|-----------|-----------|
| Y1 | 1 FTE (founder) + 2 contractors | Founder builds; content + mod contract |
| Y2 | 1 FTE + 4 contractors | + content creator, CS, designer |
| Y3 | 4 FTE + 3 contractors | + engineer, growth marketer |
| Y4 | 10 FTE | + eng (2), content (2), support |
| Y5 | 14 FTE | + finance, BD for enterprise |

### 8.2 Founder focus by year

| Year | Founder time allocation |
|------|-------------------------|
| Y1 | 60% product · 30% marketing · 10% ops |
| Y2 | 40% product · 40% marketing · 20% hiring |
| Y3 | 25% product · 35% growth · 40% team |
| Y4–5 | 15% product vision · 50% growth/BD · 35% team/culture |

---

## 9. Risk register & mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Low free→paid conversion | Medium | High | Strong upgrade moments; annual default; 14-day Pro trial at projection lock |
| Monthly churn &gt;8% | Medium | High | Community WACP; annual push; workout streak mechanics |
| PWA discovery limits on iOS | High | Medium | Install guides Y1; native app decision gate Y3 |
| Paid API costs erode Pro+ margin | Low | Medium | Defer Nutritionix until scale; monitor per-user API cost monthly |
| Competitor copies evidence positioning | Medium | Low | Depth of KB + community moat; speed of iteration |
| Stripe / Supabase price increases | Low | Medium | 94% margins absorb; multi-year contracts at scale |
| Influencer brand risk | Medium | Low | Micro-influencers only; no controversial affiliations |
| Regulatory (health claims) | Low | High | “Informational only” disclaimer (shipped); no medical advice |

---

## 10. Capital & funding

### 10.1 Bootstrap path (recommended)

| Year | Revenue | Opex | Net |
|------|---------|------|-----|
| Y1 | $72K | $40K | +$32K |
| Y2 | $432K | $180K | +$252K |
| Y3 | $1.56M | $543K | +$1.0M |
| Y4 | $4.8M | $1.8M | +$3.0M |
| Y5 | $11.4M | $2.7M | +$8.7M cumulative |

ForgeRep can reach profitability **without external funding** given existing product completion and 82–94% margins.

### 10.2 Optional raise (Y3)

If paid acquisition scales with LTV/CAC ≥3: raise **$1–2M seed** to accelerate to $5M ARR 12 months faster. Use of funds: 60% growth, 25% eng, 15% ops.

---

## 11. 90-day action plan (starting July 2026)

Priority order for the next quarter:

1. **Ship Phase 7 gaps** — Withings production QA, Strava launch, billing edge cases.
2. **Execute Instagram Day 0–31 calendar** — batch content, daily posting, UTM tracking.
3. **Instrument funnel** — signup → onboarding step → first workout → D7 workout → upgrade.
4. **Enable community A/B** — measure opt-in rate and WACP weekly via ops metrics panel.
5. **Default to annual** in upgrade flows with clear savings callout ($37.89/yr saved on Pro).
6. **Launch referral v1** — Stripe coupon “give/get month”.
7. **SEO** — publish 5 goal landing pages with structured data.
8. **ForgeRep-owned Spotify playlists** — swap placeholder IDs before marketing push.

**Day 90 success criteria:**

- ≥150 paying subscribers
- ≥1,500 registered users
- D30 retention ≥30%
- Instagram ≥1,000 followers
- WACP baseline established

---

## 12. Summary — how we hit $11M ARR in five years

| Lever | Mechanism |
|-------|-----------|
| **Generous free tier** | Complete training loop drives top-of-funnel; no credit card required |
| **Evidence trust** | Differentiates in crowded market; fuels content marketing |
| **Offline reliability** | Converts gym-goers frustrated with signal-dependent apps |
| **Community accountability** | WACP reduces churn; crews drive invites |
| **Tier economics** | 82–94% margins fund reinvestment without dilution |
| **Annual billing** | 2–3× retention vs monthly; improves cash flow |
| **Product-led upgrades** | Projection lock, analytics, integrations at moment of need |
| **Channel diversification** | Organic → affiliate → paid → coach B2B2C → enterprise |

ForgeRep is not betting on becoming the next billion-dollar unicorn on hype. It is building a **durable, profitable fitness business** by owning the intersection of **science, accountability, and offline reliability** — and executing the playbooks already documented in our product Bible, tier strategy, and launch calendar with discipline over five years.

---

## Appendix A — Source documents

| Document | Path | Used for |
|----------|------|----------|
| Product Bible | `docs/BIBLE.md` | Architecture, tiers, success metrics, infra costs |
| Tier gates | `docs/TIER-GATES.md` | Pricing, feature matrix, conversion triggers |
| Pricing ADR | `docs/ADRs/001-tier-pricing-margins.md` | Unit economics, annual strategy |
| Instagram calendar | `docs/marketing/instagram-31-day-calendar.md` | Launch content, weekly targets |
| Community plan | `docs/community-expansion-plan.md` | WACP north star, retention loops |
| Progress log | `docs/PROGRESS.md` | Current build status |

## Appendix B — Pricing reference

| Product | Monthly | Annual | Effective monthly (annual) |
|---------|---------|--------|----------------------------|
| ForgeRep Pro | $8.99 | $69.99 | $5.83 |
| ForgeRep Pro+ | $14.99 | $119.99 | $10.00 |

---

*Confidential — ForgeRep / forgeFit. For internal planning and investor review.*
