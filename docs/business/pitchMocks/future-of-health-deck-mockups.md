# Future of Health Grant — Pitch Deck Canva Build Guide

> **For:** Christopher Kendig · Carline Dad Enterprises, LLC · ForgeRep  
> **Program:** [Future of Health Grant](https://future-of-health.org/) (CSS + EPFL Innovation Park)  
> **Slides:** 10 · **Format:** 16:9 widescreen · **Deadline:** July 31, 2026  
> **Export:** PDF (upload with application)  
> **Grant level to request:** Level 2 — POC · **CHF 30,000** · 6-month program

This guide is a **slide-by-slide mockup** — exact copy, layout, colors, and assets. Open Canva, create a **Presentation (16:9)**, and build one slide per section below.

**Reuse from pitchGNV:** Brand kit, fonts, phone screenshots, and competition table can be copied. **Do not** reuse the pitchGNV ask slide or “prize → customer acquisition” framing.

**Related:** Application field answers live in chat / will be logged in `forgeRep-grant-playbook.md`. Pair this deck with that copy for consistency.

---



## Canva setup (do this first)



### Document settings


| Setting   | Value                 |
| --------- | --------------------- |
| **Type**  | Presentation          |
| **Size**  | 1920 × 1080 px (16:9) |
| **Pages** | 10                    |




### Brand colors (same as pitchGNV)


| Name          | Hex       | Use on deck                     |
| ------------- | --------- | ------------------------------- |
| Forge Ember   | `#FF6B35` | Headlines accent, CTAs, icons   |
| Forge Glow    | `#FF8C42` | Secondary accent, dividers      |
| Forge Gold    | `#FBBF24` | Stats, highlights               |
| Forge Surface | `#1C1917` | Slide background (dark deck)    |
| Forge Raised  | `#292524` | Cards, phone frames, table rows |
| Forge Text    | `#FAFAF9` | Primary text on dark            |
| Forge Muted   | `#A8A29E` | Subtitles, captions             |
| Forge Steel   | `#38BDF8` | Info callouts, Free tier        |
| Forge Success | `#22C55E` | Checkmarks, “Shipped” badges    |


**Recommended:** Dark deck — matches the app and reads well on screen share / PDF.

### Fonts


| Role      | Canva font                                       | Weight            |
| --------- | ------------------------------------------------ | ----------------- |
| Headlines | **Plus Jakarta Sans** (or **Outfit** / **Sora**) | Bold / Extra Bold |
| Body      | **Inter** (or **Open Sans**)                     | Regular / Medium  |




### Assets to gather

- [ ] `apps/web/public/logo.svg` — export PNG at 800px wide
- [ ] 3 phone screenshots from forge-rep.com (same as pitchGNV Slide 4)
- [ ] Optional: gym “no signal” photo for problem slide
- [ ] QR code to [https://forge-rep.com](https://forge-rep.com)
- [ ] Optional: simple Switzerland / CH map icon for market slide (subtle — not a flag collage)



### Fast path if you already built pitchGNV

1. Duplicate the pitchGNV Canva file → rename **Future of Health — ForgeRep**
2. Rewrite **Slides 1, 2, 6, 9 (footer), 10** using this doc
3. Light edits on **3, 5, 7, 8** (health framing + entity name)
4. Keep **Slide 4** screenshots and **Slide 9** competition table almost as-is

---



## Slide-by-slide mockups

---



### Slide 1 — Title

**Purpose:** Digital health identity + Swiss grant context in 5 seconds.

```
┌────────────────────────────────────────────────────────────────────────────┐
│  bg: #1C1917                                                               │
│                                                                            │
│                    [ForgeRep logo — centered, ~160px wide]                 │
│                                                                            │
│         Evidence-Based Digital Health for                                   │
│         Sustainable Training & Weight Management                            │
│         ───────────────────────────────────────  (ember underline)         │
│                                                                            │
│              Citation-backed programming · offline gym logging ·            │
│              integrated nutrition — prevention-stage lifestyle support.     │
│                                                                            │
│    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                    │
│    │ Prevention   │ │ Obesity /    │ │ Offline-first│                     │
│    │ focus        │ │ lifestyle    │ │ PWA          │                     │
│    └──────────────┘  └──────────────┘  └──────────────┘                    │
│                                                                            │
│         Carline Dad Enterprises, LLC · Fort Myers, FL, USA                 │
│         Christopher Kendig · Founder · forge-rep.com                       │
│                                                                            │
│              Future of Health Grant 2026 · Level 2 (POC)                   │
└────────────────────────────────────────────────────────────────────────────┘
```


| Element      | Spec                                             |
| ------------ | ------------------------------------------------ |
| **Headline** | 48–56 pt, Bold, `#FAFAF9`, center (two lines OK) |
| **Tagline**  | 22 pt, `#A8A29E`, center                         |
| **Pills**    | `#292524` fill, `#FF6B35` 2px border, 15 pt      |
| **Footer**   | 16–18 pt, `#A8A29E`                              |


**Do not put:** pitchGNV, “AI/SaaS”, or prize language on this slide.

---



### Slide 2 — The Problem

**Purpose:** Health problem first, product friction second — reviewers are digital health / insurer / EPFL-oriented.

```
┌────────────────────────────────────────────────────────────────────────────┐
│  THE PROBLEM                                                               │
│                                                                            │
│  Inactivity and poor adherence drive overweight, obesity, and              │
│  cardiometabolic risk — and digital tools often make adherence harder.     │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1  PREVENTION GAP                                                   │   │
│  │    Adults need sustainable resistance training + nutrition habits,  │   │
│  │    but drop off when tools are fragmented or scientifically opaque. │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 2  FRAGMENTED TOOLKIT                                               │   │
│  │    MyFitnessPal for macros. Strong for sets. Spreadsheet for        │   │
│  │    progress. Context lost → adherence collapses.                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 3  GYMS BREAK CLOUD-ONLY APPS                                       │   │
│  │    Poor connectivity mid-set → lost logs → unreliable adherence     │   │
│  │    data for users and any future health partner.                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 4  OPAQUE "AI WORKOUTS"                                             │   │
│  │    Black-box generators can't cite evidence. Hard to trust for      │   │
│  │    prevention or lifestyle intervention use cases.                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  Patient journey: Prevention / health maintenance · Pathology: Obesity     │
└────────────────────────────────────────────────────────────────────────────┘
```


| Element           | Spec                                                    |
| ----------------- | ------------------------------------------------------- |
| **Section label** | “THE PROBLEM” — 14 pt ALL CAPS, `#FF6B35`               |
| **Title**         | 36–40 pt Bold (keep shorter than pitchGNV if 4 cards)   |
| **Cards**         | `#292524`, number in `#FF6B35` circle                   |
| **Footer**        | 16 pt, `#A8A29E` — aligns with application form answers |


**If crowded:** Merge cards 2+3 into one “Fragmented + offline-unreliable tools” card (3 cards total).

---



### Slide 3 — The Solution

**Purpose:** One sentence + four pillars framed as digital health, not feature dump.

```
┌────────────────────────────────────────────────────────────────────────────┐
│  THE SOLUTION                                                              │
│                                                                            │
│  ForgeRep: one offline-capable platform for evidence-based training,       │
│  nutrition, and adherence — built for prevention-stage lifestyle change.   │
│                                                                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │  EVIDENCE   │ │   OFFLINE   │ │  NUTRITION  │ │ RETENTION   │           │
│  │  PRESCRIPTION│ │  ADHERENCE │ │  + FORECAST │ │  LAYER      │           │
│  │             │ │   CAPTURE   │ │             │ │             │           │
│  │ Deterministic│ │ PWA + sync │ │ Macros tied │ │ Community + │           │
│  │ engine +    │ │ in dead     │ │ to training │ │ wearables   │           │
│  │ citations   │ │ zones       │ │ goals       │ │ (Pro/Pro+)  │           │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                                            │
│  Not LLM-generated workouts — auditable rules from a curated evidence KB   │
└────────────────────────────────────────────────────────────────────────────┘
```


| Pillar | Headline              | Subtext                                           |
| ------ | --------------------- | ------------------------------------------------- |
| 1      | EVIDENCE PRESCRIPTION | Deterministic engine; 30+ peer-reviewed citations |
| 2      | OFFLINE ADHERENCE     | Works with zero signal; syncs later               |
| 3      | NUTRITION + FORECASTS | One loop for weight management                    |
| 4      | RETENTION LAYER       | Community + wearable sync                         |


---



### Slide 4 — Product Demo

**Purpose:** Show the live product. Same screenshots as pitchGNV.

```
┌────────────────────────────────────────────────────────────────────────────┐
│  PRODUCT — forge-rep.com (live)                                            │
│                                                                            │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │ [phone frame]│    │ [phone frame]│    │ [phone frame]│                  │
│  │  Workout     │    │  Evidence    │    │  Projection  │                  │
│  │  logging     │    │  citation    │    │  chart       │                  │
│  │  offline     │    │  panel       │    │  "On pace?"  │                  │
│  └──────────────┘    └──────────────┘    └──────────────┘                  │
│   Offline sets          Tap any rule        Goal trajectory                  │
│   + rest timer          → see the study     for weight / strength            │
│                                                                            │
│  Production PWA · Stripe billing live · Fitbit sync shipped                │
└────────────────────────────────────────────────────────────────────────────┘
```

**Screenshots (iPhone, dark mode):**

1. Active workout — offline / airplane mode if possible
2. Evidence panel — citation visible
3. Projections — goal trajectory

**Caption tweak vs pitchGNV:** Prefer “Goal trajectory for weight / strength” over pure lifter slang if space allows.

---



### Slide 5 — How It Works (tech + user journey)

**Purpose:** Show architecture credibility for a digital health jury.

```
┌────────────────────────────────────────────────────────────────────────────┐
│  HOW IT WORKS                                                              │
│                                                                            │
│  USER JOURNEY                                                              │
│  (1) Sign up + goal → (2) Onboard <10 min → (3) First workout →            │
│  (4) Log offline → (5) Nutrition + projections → (6) Stay consistent       │
│                                                                            │
│  TECHNICAL CORE (3 boxes)                                                  │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐            │
│  │ Evidence KB      │ │ Program engine   │ │ Offline PWA      │            │
│  │ Peer-reviewed    │ │ Deterministic    │ │ Service worker + │            │
│  │ rules + citations│ │ prescriptions    │ │ IndexedDB sync   │            │
│  │                  │ │ Auditable traces │ │ Gym-ready        │            │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘            │
│                                                                            │
│        │
└────────────────────────────────────────────────────────────────────────────┘
```

**Canva:** Timeline on top; three equal tech cards below. Footer line in `#FBBF24` or muted — this is a trust differentiator for FoH.

---



### Slide 6 — Market + Swiss relation

**Purpose:** Global ICP + honest Swiss entry plan (required for non-Swiss applicants).

```
┌────────────────────────────────────────────────────────────────────────────┐
│  MARKET & SWISS ENGAGEMENT                                                 │
│                                                                            │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐    │
│  │       TAM          │  │       SAM          │  │    ICP             │    │
│  │      $10B+         │  │      ~25M          │  │  Adults 25–45      │    │
│  │  Global fitness /  │  │  Serious           │  │  train 3–5×/week   │    │
│  │  digital fitness   │  │  recreational      │  │  want one system   │    │
│  │  apps              │  │  lifters           │  │  prevention focus  │    │
│  └────────────────────┘  └────────────────────┘  └────────────────────┘    │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  RELATION TO SWITZERLAND (honest)                                   │   │
│  │  • U.S. company today — no Swiss entity yet                         │   │
│  │  • Seeking market entry + validation via FoH network                │   │
│  │  • Why CH: prevention culture, high wearable adoption, fitness      │   │
│  │    participation, strong digital health ecosystem (CSS / EPFL)      │   │
│  │  • Plan: DE/FR localize → partner gyms / preventive health →        │   │
│  │    6-month pilot (~200 users) → document outcomes                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  We apply ForgeRep to the Swiss ecosystem — we do not claim local ops yet. │
└────────────────────────────────────────────────────────────────────────────┘
```

**Critical:** Do not invent Swiss hospital partnerships. “Planned pilot + FoH network” is the credible line.

---



### Slide 7 — Business Model

**Purpose:** Show sustainable SaaS; keep shorter than pitchGNV — FoH cares more about validation than CAC.

```
┌────────────────────────────────────────────────────────────────────────────┐
│  BUSINESS MODEL — Freemium digital health SaaS                             │
│                                                                            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │      FREE        │  │       PRO        │  │      PRO+        │          │
│  │       $0         │  │    $8.99/mo      │  │   $14.99/mo      │          │
│  │ Complete training│  │ 90-day insight + │  │ Wearables +      │          │
│  │ loop + offline   │  │ community        │  │ automation       │          │
│  │ + 30-day proj.   │  │ ★ Core revenue   │  │                  │          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│                                                                            │
│  Blended ARPU ~$11.90/mo · Contribution margin 82–94%                      │
│  Stage: Bootstrapped / pre-seed · 100% founder-owned · no equity raised    │
│                                                                            │
│  Seeking non-dilutive FoH support for Swiss validation — not a seed round  │
└────────────────────────────────────────────────────────────────────────────┘
```

**Copy-paste bullets:** Reuse pitchGNV Free / Pro / Pro+ feature lists if space; otherwise keep the short card version above.

**Footer must include:** Bootstrapped / pre-seed — matches application fundraising field.

---



### Slide 8 — Traction & Readiness

**Purpose:** Prove Level 2 (POC) maturity — product exists; Swiss validation is the gap.

```
┌────────────────────────────────────────────────────────────────────────────┐
│  TRACTION & READINESS — why Level 2 (POC)                                  │
│                                                                            │
│  ┌─────────────────────────┐  ┌─────────────────────────┐                │
│  │  PRODUCT: LIVE          │  │  SWISS: TO VALIDATE     │                │
│  │  Production PWA         │  │  Localization + pilot   │                │
│  │  forge-rep.com          │  │  = FoH Level 2 purpose  │                │
│  └─────────────────────────┘  └─────────────────────────┘                │
│                                                                            │
│  SHIPPED ✓                                                                 │
│  ✓ Offline workout logging (PWA)                                           │
│  ✓ Evidence KB (30+ citations) + deterministic program engine              │
│  ✓ Nutrition diary + projections                                           │
│  ✓ Stripe billing Free / Pro / Pro+                                        │
│  ✓ Community accountability + Fitbit / Google Health sync                  │
│  ✓ MVP: first workout <10 min · Lighthouse PWA ≥90                         │
│                                                                            │
│  Built Jun 2026 · Solo founder · Fort Myers, FL · Carline Dad Enterprises  │
└────────────────────────────────────────────────────────────────────────────┘
```

**Framing tip:** Left = done. Right = what the grant unlocks. That is the Level 2 story.

---



### Slide 9 — Competition & differentiation

**Purpose:** Same competitive honesty as pitchGNV, plus one digital-health line.

```
┌────────────────────────────────────────────────────────────────────────────┐
│  COMPETITIVE LANDSCAPE                                                     │
│  Everyone solves one piece. No one owns explainable training + nutrition   │
│  + offline adherence in one prevention-ready system.                       │
│                                                                            │
│  TODAY: MFP (macros) + Strong (sets) + opaque AI (workouts) + spreadsheet  │
│                                                                            │
│  FEATURE COMPARISON                                                        │
│                        MFP   Strong  Fitbod  MacroF   FORGEREP             │
│  Evidence programs      —      —      ◐       —         ✓                  │
│  Macros + training      ◐      —      —       ◐         ✓                  │
│  Offline gym UX         ◐      ◐      ◐       ◐         ✓                  │
│  Auditable / citable    —      —      —       ◐         ✓                  │
│  Prevention-ready loop  ◐      —      —       ◐         ✓                  │
│                                                                            │
│  MOAT: Unified loop · Offline-first · Evidence KB (not LLM workouts)       │
└────────────────────────────────────────────────────────────────────────────┘
```

**Full competitor cards / table:** Copy from `pitchGNV-deck-mockups.md` Slide 9 if you want the richer layout. Add row **Auditable / citable** and **Prevention-ready loop** as above.

**Closing line:**  
“We don’t compete for the biggest food database — we win adults who need one trustworthy system for sustainable training and weight management.”

---



### Slide 10 — Grant ask & use of funds

**Purpose:** Clear Level 2 ask + Swiss outcomes. **This replaces pitchGNV Slide 10 entirely.**

```
┌────────────────────────────────────────────────────────────────────────────┐
│  THE ASK — Future of Health Level 2 (POC)                                  │
│                                                                            │
│              CHF 30,000 · 6-month program · equity-free                    │
│                                                                            │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐               │
│  │    35%     │ │    40%     │ │    15%     │ │    10%     │               │
│  │ Localize   │ │ Swiss      │ │ Partners   │ │ Evaluate   │               │
│  │ DE / FR    │ │ pilot      │ │ & ops      │ │ & GTM      │               │
│  │ + privacy  │ │ ~200 users │ │ gyms /     │ │ plan       │               │
│  │ readiness  │ │ 6 months   │ │ preventive │ │            │               │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘               │
│                                                                            │
│  OUTCOMES                                                                  │
│  • Localized ForgeRep for Swiss users                                      │
│  • Adherence & usability evidence from real Swiss gym users                │
│  • Partner relationships via FoH coaching / network                        │
│  • Clear Switzerland go-to-market plan (path to Level 3 if warranted)      │
│                                                                            │
│  Christopher Kendig · Carline Dad Enterprises, LLC · forge-rep.com  [QR]   │
└────────────────────────────────────────────────────────────────────────────┘
```


| Bucket         | %   | CHF (of 30K) | Use                                                                    |
| -------------- | --- | ------------ | ---------------------------------------------------------------------- |
| Localize       | 35% | ~10,500      | DE/FR UI, metric defaults, Swiss nutrition defaults, privacy hardening |
| Swiss pilot    | 40% | ~12,000      | Recruit/run ~200 users, 6 months, adherence metrics                    |
| Partners & ops | 15% | ~4,500       | Gym / preventive-health outreach, onboarding materials                 |
| Evaluate & GTM | 10% | ~3,000       | Analysis, report, Switzerland market-entry plan                        |


**Do not put:** U.S. influencer Reels, paid social CAC, pitchGNV prize language.

**Optional CHF breakdown line under bars:**  
`~CHF 10.5K · 12K · 4.5K · 3K`

---



## Canva workflow



### Step 1 — Duplicate or start (15 min)

- **Best:** Duplicate pitchGNV Canva → rename  
- Or: “Tech pitch deck dark” template → Forge palette



### Step 2 — Master slide (10 min)

Set on Slide 1, copy style: bg `#1C1917`, headline font, ember accents, muted captions.

### Step 3 — Build order (2–3 hours)

1. Slide 10 (ask) — write this first so the whole deck points at Swiss validation
2. Slides 1, 2, 6 — FoH-specific
3. Slides 3, 5, 7, 8 — light rewrites
4. Slides 4, 9 — mostly reuse



### Step 4 — Review checklist

- [ ] Legal name **Carline Dad Enterprises, LLC** on title and close  
- [ ] Product name **ForgeRep** clear throughout  
- [ ] **Level 2 / CHF 30K** on Slide 10  
- [ ] Swiss relation is **planned**, not claimed as existing  
- [ ] No pitchGNV / prize / “$20K CAC” leftover text  
- [ ] Prevention + obesity framing on problem slide  
- [ ] Bootstrapped / pre-seed stated once (Slide 7 or 10)  
- [ ] QR + forge-rep.com on final slide  
- [ ] Export PDF, open on phone — text still readable  

---



## Presenter notes (paste into Canva Notes)

Use if you get a live pitch / interview. PDF reviewers won’t see these — still write them so your verbal story matches the deck.

**Target total:** ~4–5 minutes if presenting live; ~2:30 if they ask for a short video later.

---



### Slide 1 — Title (~20 sec)

> "I'm Christopher Kendig, founder of Carline Dad Enterprises. Our digital health product is ForgeRep — an evidence-based platform for sustainable training and weight management. We're applying for Future of Health Level 2 to validate ForgeRep with Swiss users."

---



### Slide 2 — The Problem (~35 sec)

> "Physical inactivity and poor adherence drive overweight and obesity risk. Even motivated adults fail when tools fight them: one app for macros, one for sets, and AI workouts you can't audit. Gyms often have no signal, so cloud-only apps lose the session — and any adherence data with it. Prevention needs tools people can actually follow in the real world."

---



### Slide 3 — The Solution (~25 sec)

> "ForgeRep puts evidence-based programming, nutrition, and offline logging in one Progressive Web App. Prescriptions come from a deterministic engine with peer-reviewed citations — not black-box AI. That makes the system explainable for prevention-stage lifestyle support."

---



### Slide 4 — Product Demo (~30 sec)

> "This is the live product at forge-rep.com. Left: logging sets offline in the gym. Center: tap a progression rule and see the study behind it. Right: projections that answer whether you're on pace for your goal. Judges can verify this today — we're not asking you to fund a prototype from zero."

---



### Slide 5 — How It Works (~30 sec)

> "Users onboard in under ten minutes, get a program, train offline, and log nutrition in the same loop. Under the hood: an evidence knowledge base, a deterministic program engine with auditable decision traces, and IndexedDB sync for dead zones. We use AI only for coaching copy — never to invent workouts."

---



### Slide 6 — Market & Swiss (~40 sec)

> "Our primary users are adults twenty-five to forty-five who train three to five times a week and want one trustworthy system. We're a U.S. company with no Swiss entity yet — I'm being direct about that. Switzerland is our first European validation market because of prevention culture, wearable adoption, and this ecosystem. The plan is localize German and French, pilot with gym and preventive-health partners, and measure adherence over six months with your network's help."

---



### Slide 7 — Business Model (~25 sec)

> "Freemium SaaS: Free is a complete training loop, Pro at eight ninety-nine is core revenue, Pro+ adds wearables. Margins are eighty-two to ninety-four percent. We're bootstrapped and pre-seed — no outside equity. This grant is non-dilutive support for Swiss validation, not a substitute for a seed round."

---



### Slide 8 — Traction (~25 sec)

> "The product is in production: offline PWA, evidence engine, nutrition, billing, community, Fitbit sync. That's why Level 2 fits — proof of concept and Swiss validation, not ignition from an idea. What we haven't done yet is localize and prove it with Swiss users. That's the gap this grant closes."

---



### Slide 9 — Competition (~35 sec)

> "MyFitnessPal owns food. Strong owns logging. Fitbod owns convenience. MacroFactor owns nutrition science. Our user still juggles two or three of them. ForgeRep owns the integrated, explainable loop — evidence-based training, macros, offline adherence — built for prevention, not for the biggest calorie database."

---



### Slide 10 — The Ask (~40 sec)

> "We're asking for Level 2: thirty thousand Swiss francs over six months. Thirty-five percent localizes the product for German and French users. Forty percent runs a Swiss pilot of about two hundred users and measures adherence. Fifteen percent is partner outreach and pilot ops. Ten percent is evaluation and a clear Switzerland go-to-market plan. Success looks like a localized product, real Swiss user evidence, and relationships that could lead to Level 3 validation later. I'm Christopher Kendig — thank you."

---



### Quick-reference table (one-liners)


| Slide | One-line cue                             |
| ----- | ---------------------------------------- |
| 1     | Digital health + Level 2 + who we are    |
| 2     | Obesity/prevention + broken tools        |
| 3     | One explainable offline platform         |
| 4     | Live product — three screens             |
| 5     | Journey + evidence engine + offline      |
| 6     | ICP + honest Swiss entry plan            |
| 7     | Freemium + bootstrapped                  |
| 8     | Live product; Swiss still to validate    |
| 9     | Pieces vs integrated loop                |
| 10    | CHF 30K → localize, pilot, partners, GTM |


---



## Quick reference — all slide titles


| #   | Title                                  |
| --- | -------------------------------------- |
| 1   | Title — Evidence-Based Digital Health… |
| 2   | The Problem                            |
| 3   | The Solution                           |
| 4   | Product — forge-rep.com                |
| 5   | How It Works                           |
| 6   | Market & Swiss Engagement              |
| 7   | Business Model                         |
| 8   | Traction & Readiness                   |
| 9   | Competitive Landscape                  |
| 10  | The Ask — Level 2 (CHF 30K)            |


---



## Alignment with application form


| Form theme                               | Deck slide  |
| ---------------------------------------- | ----------- |
| Company one-liner / detailed description | 1, 3, 8     |
| Patient journey = prevention             | 2 footer, 3 |
| Pathology = obesity                      | 2           |
| Key technologies                         | 5           |
| Specific population                      | 6           |
| Problem / solution                       | 2, 3        |
| Target market                            | 6           |
| Swiss relation                           | 6           |
| Competitors                              | 9           |
| Fundraising stage                        | 7           |
| Use of grant                             | 10          |


---

*Pair with* `docs/business/forgeRep-grant-playbook.md` *(Future of Health section) and* `docs/business/pitchGNV-deck-mockups.md` *(reusable competition + screenshot specs).*