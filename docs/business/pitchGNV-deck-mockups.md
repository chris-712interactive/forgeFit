# pitchGNV Pitch Deck — Canva Build Guide

> **For:** Christopher Kendig · ForgeRep · pitchGNV 2026  
> **Slides:** 10 · **Format:** 16:9 widescreen · **Deadline:** July 10, 2026  
> **Export:** PDF (upload to pitchGNV application)

This guide is a **slide-by-slide mockup** — exact copy, layout, colors, and assets. Open Canva, create a **Presentation (16:9)**, and build one slide per section below.

---

## Canva setup (do this first)

### Document settings

| Setting | Value |
|---------|-------|
| **Type** | Presentation |
| **Size** | 1920 × 1080 px (16:9) — Canva default “Presentation” |
| **Pages** | 10 |

### Brand colors (add under Brand Kit → Colors)

| Name | Hex | Use on deck |
|------|-----|-------------|
| Forge Ember | `#FF6B35` | Headlines accent, CTAs, icons |
| Forge Glow | `#FF8C42` | Secondary accent, dividers |
| Forge Gold | `#FBBF24` | Stats, highlights, “Pro” tier |
| Forge Surface | `#1C1917` | Slide background (dark deck) |
| Forge Raised | `#292524` | Cards, phone frames, table rows |
| Forge Text | `#FAFAF9` | Primary text on dark |
| Forge Muted | `#A8A29E` | Subtitles, captions |
| Forge Steel | `#38BDF8` | “Free” tier, info callouts |
| Forge Success | `#22C55E` | Checkmarks, “Shipped” badges |

**Recommended:** Dark deck (Forge Surface background) — matches the app and reads well on a projector.

### Fonts (Canva equivalents)

| Role | Canva font | Weight |
|------|------------|--------|
| Headlines | **Plus Jakarta Sans** (or **Outfit** / **Sora** if unavailable) | Bold / Extra Bold |
| Body | **Inter** (or **Open Sans**) | Regular / Medium |

### Assets to gather before you start

- [ ] `apps/web/public/logo.svg` — export PNG at 800px wide for Canva
- [ ] 3 phone screenshots from forge-rep.com (see Slide 4)
- [ ] Optional: gym photo (phone with no signal) for Slide 2
- [ ] QR code to https://forge-rep.com (Canva has QR element, or qr-code-generator.com)

---

## Slide-by-slide mockups

Each slide includes: **layout wireframe**, **exact copy**, **Canva build steps**.

---

### Slide 1 — Title

**Purpose:** Hook + who you are in 5 seconds.

```
┌────────────────────────────────────────────────────────────────────────────┐
│  bg: #1C1917                                                               │
│                                                                            │
│                    [ForgeRep logo — centered, ~180px wide]                 │
│                                                                            │
│         Evidence-Based Fitness That Works Offline                          │
│         ───────────────────────────────────────  (ember underline)         │
│                                                                            │
│              Train with intention — programs, macros,                      │
│              and progress grounded in science.                               │
│                                                                            │
│    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                    │
│    │  Offline PWA │  │ 30+ citations│  │ Billing live │   ← 3 pills       │
│    └──────────────┘  └──────────────┘  └──────────────┘                    │
│                                                                            │
│         Christopher Kendig · Founder & CEO                                 │
│         Fort Myers, FL · forge-rep.com                                     │
│                                                                            │
│                              pitchGNV 2026                                 │
└────────────────────────────────────────────────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| **Headline** | 54–64 pt, Bold, `#FAFAF9`, center |
| **Tagline** | 24 pt, `#A8A29E`, center |
| **Pills** | Rounded rects, `#292524` fill, `#FF6B35` 2px border, 16 pt text |
| **Footer** | 18 pt, `#A8A29E` |

**Canva tips:** Search “Tech pitch deck dark” template → swap colors to Forge palette. Delete extra elements until this layout remains.

---

### Slide 2 — The Problem

**Purpose:** Make judges feel the pain (they’ve lived it or know someone who has).

```
┌────────────────────────────────────────────────────────────────────────────┐
│  THE PROBLEM                                    [optional: phone + no wifi]│
│  ───────────                                                               │
│                                                                            │
│  Serious lifters juggle 2–3 apps — and gyms break cloud-only tools.        │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1  FRAGMENTED TOOLKIT                                               │   │
│  │    MyFitnessPal for macros. Strong for sets. A spreadsheet for      │   │
│  │    progress. Context lost. Adherence drops.                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 2  GYMS HAVE NO SIGNAL                                              │   │
│  │    Basement racks, garage gyms, crowded facilities — apps fail        │   │
│  │    mid-set when they need live API calls.                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 3  "AI WORKOUTS" YOU CAN'T TRUST                                    │   │
│  │    Opaque generators can't cite their logic. Bro-science wins.      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  $10B+ market · $8–15/mo willingness to pay · retention still broken       │
└────────────────────────────────────────────────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| **Section label** | “THE PROBLEM” — 14 pt, ALL CAPS, `#FF6B35`, letter-spacing 2px |
| **Title** | 44 pt Bold |
| **Problem cards** | `#292524` rounded cards, number in `#FF6B35` circle (32px) |
| **Bottom stat bar** | 18 pt, `#FBBF24` for dollar figures |

**Optional right column:** Stock photo or your photo — hand holding phone with “No Service” in status bar.

---

### Slide 3 — The Solution

**Purpose:** One sentence + four pillars. No feature dump.

```
┌────────────────────────────────────────────────────────────────────────────┐
│  THE SOLUTION                                                              │
│                                                                            │
│  One app: evidence-based programming + macros + projections +              │
│  accountability — offline in the gym.                                      │
│                                                                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   📋 icon   │ │   📶 icon   │ │   🍽 icon   │ │   👥 icon   │           │
│  │  EVIDENCE   │ │   OFFLINE   │ │  NUTRITION  │ │ COMMUNITY   │           │
│  │  PROGRAMS   │ │   LOGGING   │ │  + MACRO    │ │ (Pro tier)  │           │
│  │             │ │             │ │  FORECASTS  │ │             │           │
│  │ 30+ peer-   │ │ Works with  │ │ One loop,   │ │ Crews,      │           │
│  │ reviewed    │ │ zero signal │ │ not 3 apps  │ │ leagues,    │           │
│  │ citations   │ │ Syncs later │ │             │ │ accountability│         │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                                            │
│  Progressive Web App — installs like native · no App Store required        │
└────────────────────────────────────────────────────────────────────────────┘
```

**Use Canva icons** (not emoji in final deck): search “document check”, “wifi off”, “nutrition”, “people” — color `#FF6B35`.

| Pillar | Headline | Subtext |
|--------|----------|---------|
| 1 | EVIDENCE PROGRAMS | 30+ peer-reviewed citations; not opaque AI |
| 2 | OFFLINE LOGGING | Works with zero signal; syncs when back online |
| 3 | NUTRITION + FORECASTS | One loop, not three apps |
| 4 | COMMUNITY | Crews, leagues, accountability (Pro) |

---

### Slide 4 — Product Demo

**Purpose:** Show, don’t tell. **Real screenshots only.**

```
┌────────────────────────────────────────────────────────────────────────────┐
│  PRODUCT DEMO — forge-rep.com                                              │
│                                                                            │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │ [phone frame]│    │ [phone frame]│    │ [phone frame]│                  │
│  │              │    │              │    │              │                  │
│  │  Workout     │    │  Evidence    │    │  Projection  │                  │
│  │  logging     │    │  citation    │    │  chart       │                  │
│  │  offline     │    │  panel       │    │  "On pace?"  │                  │
│  │              │    │              │    │              │                  │
│  └──────────────┘    └──────────────┘    └──────────────┘                  │
│   Offline sets          Tap any rule        Am I on pace                     │
│   + rest timer          → see the study     for my goal?                     │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**Screenshots to capture (iPhone, dark mode):**

1. **Active workout** — mid-set logging, rest timer visible, “Offline” or airplane mode indicator if possible
2. **Evidence panel** — progression rule with citation link visible
3. **Projections / analytics** — chart showing goal trajectory

**Canva build:**

1. Search element **“iPhone mockup”** or **“phone frame”**
2. Drop screenshot inside frame
3. Caption below each: 16 pt, `#A8A29E`, center

---

### Slide 5 — How It Works

**Purpose:** Simple user journey → first value in <10 minutes.

```
┌────────────────────────────────────────────────────────────────────────────┐
│  HOW IT WORKS                                                              │
│                                                                            │
│   (1)          (2)          (3)          (4)          (5)                  │
│  Sign up  →  Onboard  →  First workout →  Log offline →  Upgrade at        │
│  + goal      <10 min      in gym          Syncs          insight moment      │
│                                                                            │
│  ●───────────●───────────●───────────●───────────●                         │
│  ember line connecting circles                                             │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  UPGRADE TRIGGER (Pro)                                             │    │
│  │  User hits 30-day projection limit → "See your goal date → Pro"    │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                            │
│  Free tier = complete training loop · Pro unlocks 90-day + community       │
└────────────────────────────────────────────────────────────────────────────┘
```

**Canva:** Use **“Process”** or **“Timeline”** template element. 5 circles with numbers; ember connector line. Bottom callout box in `#292524`.

| Step | Label | Detail |
|------|-------|--------|
| 1 | Sign up + goal | 7-step onboarding |
| 2 | Onboard <10 min | Bible MVP metric |
| 3 | First workout | Evidence-based program assigned |
| 4 | Log offline | Dexie PWA sync |
| 5 | Upgrade moment | Projection insight → Pro |

---

### Slide 6 — Market

**Purpose:** Big enough to matter, narrow enough to win.

```
┌────────────────────────────────────────────────────────────────────────────┐
│  MARKET OPPORTUNITY                                                        │
│                                                                            │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐    │
│  │       TAM          │  │       SAM          │  │    BEACHHEAD       │    │
│  │      $10B+         │  │      ~25M          │  │  Organic social +  │    │
│  │  Global fitness    │  │  English-speaking  │  │  micro-influencers │    │
│  │  app market        │  │  serious lifters   │  │  (1–10K followers) │    │
│  └────────────────────┘  └────────────────────┘  └────────────────────┘    │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  IDEAL CUSTOMER                                                     │   │
│  │  Alex, 32 · trains 4×/week · used MFP + Strong · wants ONE system   │   │
│  │  Intermediate lifter · returning after a break OR optimizing cut/bulk │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  We win on trust + retention — not feature breadth.                        │
└────────────────────────────────────────────────────────────────────────────┘
```

| Stat | Display |
|------|---------|
| TAM | `$10B+` in 48 pt `#FBBF24` |
| SAM | `~25M` in 48 pt `#FBBF24` |
| ICP | Persona card with stock avatar or illustrated silhouette |

---

### Slide 7 — Business Model

**Purpose:** Judges want to know how you make money, that margins work, and **what each tier actually unlocks**.

```
┌────────────────────────────────────────────────────────────────────────────┐
│  BUSINESS MODEL — Freemium SaaS                                            │
│                                                                            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │      FREE        │  │       PRO        │  │      PRO+        │          │
│  │       $0         │  │    $8.99/mo      │  │   $14.99/mo      │          │
│  │                  │  │   $69.99/yr      │  │  $119.99/yr      │          │
│  │ ✓ Personalized   │  │ ✓ Everything in  │  │ ✓ Everything in  │          │
│  │   programs       │  │   Free           │  │   Pro            │          │
│  │ ✓ Offline workout│  │ ✓ 90-day proj.   │  │ ✓ Fitbit /       │          │
│  │   logging & sync │  │   + confidence   │  │   Withings sync  │          │
│  │ ✓ Nutrition diary│  │   bands          │  │ ✓ Restaurant     │          │
│  │   + macro targets│  │ ✓ Strength & PR  │  │   quick-log      │          │
│  │ ✓ Measurements & │  │   analytics      │  │ ✓ AI coaching &  │          │
│  │   30-day proj.   │  │ ✓ Community:     │  │   PR celebration │          │
│  │ ✓ Exercise       │  │   leaderboards,  │  │                  │          │
│  │   library        │  │   rivals, wins   │  │                  │          │
│  │                  │  │ ✓ Unlimited      │  │                  │          │
│  │                  │  │   history, export│  │   ★ Automation   │          │
│  │                  │  │                  │  │                  │          │
│  │                  │  │   ★ Core $       │  │                  │          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│   border #38BDF8         border #FF6B35          border #FBBF24            │
│                                                                            │
│  Blended ARPU ~$11.90/mo  ·  Contribution margin 82–94%                    │
│                                                                            │
│  Path: $6K MRR (Y1) → $36K MRR (Y2) → profitability without VC burn        │
└────────────────────────────────────────────────────────────────────────────┘
```

#### Copy-paste bullets (per card)

Use **14–16 pt** body text, **green checkmarks** (`#22C55E`) or ember bullets. Keep **4–6 lines per card** — trim if text overflows.

**FREE — $0**

- Personalized program generation
- Offline workout logging & sync
- Nutrition diary with macro targets
- Measurements, trends & 30-day projections
- Full exercise library with animations

**PRO — $8.99/mo · $69.99/yr** *(highlight this card — core revenue tier)*

- Everything in Free
- 90-day projections with confidence bands
- Strength progression & PR history
- Volume trends & nutrition adherence
- Unlimited history, export & progress photos
- Community leaderboards, rivals & win feed

**PRO+ — $14.99/mo · $119.99/yr**

- Everything in Pro
- Withings, Fitbit & Strava sync
- Restaurant quick-log & saved meals
- AI coaching & PR celebration UX

**Footer strip (below cards):** Blended ARPU ~$11.90/mo · Contribution margin 82–94% · Path: $6K MRR (Y1) → $36K MRR (Y2)

**Canva build:**

1. Search **“Pricing table”** or **“3 column comparison”** — dark background variant
2. Three equal-width cards on `#292524` with tier-colored borders (Free = steel, Pro = ember, Pro+ = gold)
3. Make **Pro card ~5% taller** or add subtle ember glow — it’s your main monetization tier
4. Left-align bullets inside each card; use a small check icon element (duplicate per line)
5. Optional tag under tier name: Free = “Complete training loop” · Pro = “Long-horizon intelligence” · Pro+ = “Automation & integrations”

**Highlight Pro column:** Slightly taller or ember glow border — it’s your core monetization tier.

---

### Slide 8 — Traction & Readiness

**Purpose:** Prove you’re not a slide deck — TRL 8, CRL 5→6, shipped.

```
┌────────────────────────────────────────────────────────────────────────────┐
│  TRACTION & READINESS                                                      │
│                                                                            │
│  ┌─────────────────────────┐  ┌─────────────────────────┐                │
│  │  TRL 8                  │  │  CRL 5 → 6              │                │
│  │  Production PWA live    │  │  Public launch Q3 2026  │                │
│  │  forge-rep.com          │  │  Target: 50 paying → CRL6│                │
│  └─────────────────────────┘  └─────────────────────────┘                │
│                                                                            │
│  SHIPPED ✓                          BUILT IN <1 MONTH                     │
│  ─────────────────                  ───────────────────                    │
│  ✓ Offline workout logging          First commit: June 8, 2026             │
│  ✓ Evidence KB (30+ citations)      258 commits · AI-assisted dev          │
│  ✓ Stripe billing Free/Pro/Pro+     Solo founder · Fort Myers, FL          │
│  ✓ Community (crews, leagues)                                              │
│  ✓ Fitbit / Google Health sync                                               │
│  ✓ MVP: first workout <10 min                                              │
│                                                                            │
│  Founder dogfooding on production · external cohort starts at launch        │
└────────────────────────────────────────────────────────────────────────────┘
```

**Checkmarks:** Use `#22C55E` — not red. **Stats row:** `#FBBF24` for “258 commits” and “June 8, 2026”.

---

### Slide 9 — Competition

**Purpose:** Show you understand the market, respect incumbents, and explain **why no one else owns the integrated lifter loop** — not just “we’re better.”

Judges want three things here:
1. **Category clarity** — what each competitor is actually good at
2. **The gap** — what serious lifters still stitch together manually
3. **Your wedge** — why ForgeRep wins on trust + integration, not feature count

---

#### Recommended layout (one slide, three zones)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  COMPETITIVE LANDSCAPE                                                     │
│  Everyone solves one piece. No one owns the integrated lifter loop.          │
│                                                                            │
│  TODAY'S REALITY (callout strip, #292524)                                  │
│  MyFitnessPal for macros  +  Strong for sets  +  spreadsheet for progress  │
│                                                                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌───────┐│
│  │ MyFitnessPal    │  │ Strong / Hevy   │  │ Fitbod          │  │Macro- ││
│  │ ✓ Huge food DB  │  │ ✓ Fast logging  │  │ ✓ AI workouts   │  │Factor ││
│  │ ✗ No programs   │  │ ✗ No macros     │  │ ✗ Black-box AI  │  │✓ Smart││
│  │ ✗ Ads on free   │  │ ✗ No projections│  │ ✗ No citations  │  │nutrition│
│  │                 │  │                 │  │                 │  │✗ Weak ││
│  │                 │  │                 │  │                 │  │offline││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └───────┘│
│                                                                            │
│  FEATURE COMPARISON                                                        │
│  ─────────────────────────────────────────────────────────────────────     │
│                        MFP   Strong  Fitbod  MacroF   FORGEREP ← highlight│
│  Evidence programs      —      —      ◐       —         ✓                  │
│  Macros + training      ◐      —      —       ◐         ✓                  │
│  Offline gym UX         ◐      ◐      ◐       ◐         ✓                  │
│  Projections + goal     ◐      —      —       ◐         ✓                  │
│  Community accountability —    —      —       —         ✓                  │
│                                                                            │
│  ✓ = strong   ◐ = partial   — = missing   (green / amber / muted gray)   │
│                                                                            │
│  FORGEREP MOAT                                                             │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐            │
│  │ Unified loop     │ │ Offline-first    │ │ Evidence KB      │            │
│  │ Program → macros │ │ PWA + Dexie sync │ │ 30+ citations;   │            │
│  │ → projections  │ │ works in dead zones│ │ not LLM workouts │            │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘            │
│                                                                            │
│  We don't compete for the biggest food database — we win the lifter who    │
│  meal-preps, trains offline, and wants one system they can trust.          │
└────────────────────────────────────────────────────────────────────────────┘
```

---

#### Copy-paste: competitor callout cards (4 boxes)

Use **16–18 pt** for competitor name, **14 pt** for bullets. Green ✓ for strength, muted ✗ for gap.

**MyFitnessPal**
- ✓ Industry-largest food database & barcode scanning
- ✗ No evidence-based programming
- ✗ Ads on free tier; streak-guilt UX

**Strong / Hevy**
- ✓ Best-in-class set logging & PR tracking
- ✗ No macro targets or program integration
- ✗ No progress projections or goal dates

**Fitbod**
- ✓ Convenient AI-generated workouts
- ✗ Opaque logic — can't audit why an exercise was chosen
- ✗ No nutrition loop; cloud-dependent

**MacroFactor**
- ✓ Strong adaptive nutrition science (SBS credibility)
- ✗ Nutrition-first — weak offline gym UX
- ✗ No community accountability layer

---

#### Copy-paste: feature comparison table

Make the **ForgeRep column** ember-bordered or ember-filled header. Use icon checkmarks, not text "✓" if Canva has them.

| Capability | MFP | Strong | Fitbod | MacroFactor | **ForgeRep** |
|------------|:---:|:------:|:------:|:-----------:|:------------:|
| Evidence-based programming | — | — | ◐ | — | **✓** |
| Macros integrated with training plan | ◐ | — | — | ◐ | **✓** |
| Reliable offline gym logging | ◐ | ◐ | ◐ | ◐ | **✓** |
| Projections + goal date ("on pace?") | ◐ | — | — | ◐ | **✓** |
| Community accountability (rivals, wins) | — | — | — | — | **✓** |

**How to score honestly (so judges trust you):**
- **◐ partial** = does one piece (e.g. MFP has macros but not tied to your program; Strong logs offline-ish but not nutrition)
- **—** = not a core product strength
- Don't claim "biggest food DB" — that's MFP's lane and you'd lose credibility

---

#### Copy-paste: ForgeRep moat (3 pillars)

Three equal cards at the bottom — ember accent on first word of each title.

| Pillar | One-line | Subtext (optional, 12 pt) |
|--------|----------|---------------------------|
| **Unified loop** | Program → macros → projections in one app | Training drives macro targets, not a separate calorie line item |
| **Offline-first** | PWA built for dead zones | Dexie sync — session never dies mid-set |
| **Evidence KB** | Deterministic engine, 30+ citations | AI only for coaching copy on Pro+ — never workout structure |

**Closing line (footer, 18 pt, muted):**  
"We don't compete for the biggest food database. We win the serious lifter who wants one trustworthy system."

---

#### Canva build steps

1. **Headline + subhead** at top — subhead is your positioning thesis (one sentence)
2. **Gray callout strip** — the "MFP + Strong + spreadsheet" patchwork reality (judges nod here)
3. **4 competitor cards** — 2×2 grid or single row of 4 narrow cards; keep each to 3 lines max
4. **Comparison table** — use Canva **"Table"** element; highlight ForgeRep column in `#FF6B35`
5. **3 moat pills** — rounded rectangles, `#292524` fill, ember left border
6. **Footer quote** — single line, centered

**If the slide feels crowded:** Drop the 4 callout cards and keep **callout strip + table + moat**. The table alone is stronger than dots.

---

#### Alternative layout: 2×2 positioning map

Use this **instead of** the 4 competitor cards if you prefer a visual "where we sit" chart. Keep the table + moat below it.

```
                    HIGH INTEGRATION
                    (program + macros + projections)
                           ▲
                           │
              MacroFactor  │     ★ ForgeRep
              (nutrition)  │       (integrated + evidence)
                           │
    LOW EVIDENCE ──────────┼────────── HIGH EVIDENCE
    TRANSPARENCY           │           TRANSPARENCY
                           │
              MFP          │     Fitbod
              (nutrition   │     (AI workouts,
               only)       │      opaque)
                           │
              Strong       │
              (logging)    │
                           ▼
                    LOW INTEGRATION
```

- **X-axis:** Evidence transparency (citations, auditable logic)
- **Y-axis:** Integration depth (nutrition-only → full training loop)
- Plot competitors as labeled dots; **ForgeRep** top-right in ember with a star
- **Strong** bottom-center; **MFP** bottom-left; **Fitbod** center-right; **MacroFactor** upper-left

---

#### What to say on this slide (presenter note)

See **Presenter notes → Slide 9** at the end of this doc for the full script.

> "MyFitnessPal is great at food. Strong is great at logging. Fitbod is great at convenience. MacroFactor is great at nutrition science. But our customer — the 25-to-45-year-old who trains four times a week — still juggles two or three apps and a spreadsheet. ForgeRep is the only one built around the full loop: evidence-based programming, macros tied to your plan, offline logging, and projections that answer 'am I on pace?' We don't need the biggest food database. We need to be the app you open before every set."

**Tone:** Respectful, not trash-talk. "Great at X, weak at Y" builds trust with judges.

---

### Slide 10 — The Ask

**Purpose:** Close with clear use of funds + CTA.

```
┌────────────────────────────────────────────────────────────────────────────┐
│  bg: #1C1917 with subtle ember gradient corner (optional, very subtle)    │
│                                                                            │
│                         THE ASK                                            │
│                                                                            │
│              pitchGNV prize → $20K customer acquisition                    │
│                                                                            │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐               │
│  │   $8K      │ │   $6K      │ │   $4K      │ │   $2K      │               │
│  │ Influencer │ │ Paid social│ │ Annual plan│ │ Referral   │               │
│  │ Reels      │ │ tests      │ │ promos     │ │ program    │               │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘               │
│                                                                            │
│              12-MONTH GOAL: 500 paying · ~$6K MRR                          │
│                                                                            │
│         [QR code]     Christopher Kendig                                   │
│                       christopher@___ · forge-rep.com                      │
│                       Fort Myers, FL                                       │
│                                                                            │
│                       Train with intention.                                │
└────────────────────────────────────────────────────────────────────────────┘
```

| Allocation | Amount | One-line |
|------------|--------|----------|
| Micro-influencer Reels | $8K | 10–16 fitness creators (1–10K followers) |
| Paid social tests | $6K | Meta/TikTok — returning lifter segments |
| Annual plan promos | $4K | Stripe “2 months free” annual push |
| Referral program | $2K | Give a month, get a month Pro credits |

**QR code:** Links to https://forge-rep.com — judges can open the live app during Q&A.

**Presenter note:** See **Presenter notes → Slide 10** at the end of this doc.

---

## Canva workflow (first-time friendly)

### Step 1 — Pick a starting point (15 min)

1. Canva → **Create a design** → **Presentation (16:9)**
2. Search templates: **“startup pitch deck dark”** or **“tech pitch minimal”**
3. Pick one with **large headlines and lots of whitespace** — not busy infographics
4. Apply your Brand Kit colors

### Step 2 — Master slide (10 min)

Set on Slide 1, then **copy style** to others:

- Background: `#1C1917`
- Default text: `#FAFAF9`
- Accent: `#FF6B35` for labels and lines

### Step 3 — Build slides 2–10 (2–3 hours)

Work in order. **Spend the most time on Slides 4 and 8** (screenshots + traction).

### Step 4 — Screenshots (30 min)

On your phone:

1. Enable dark mode on forge-rep.com (or use as-is)
2. Screenshot workout, evidence, projection
3. AirDrop to desktop → upload to Canva

### Step 5 — Review checklist

- [ ] Every slide has **one main idea** — readable from 20 feet away
- [ ] No paragraph longer than 3 lines
- [ ] Font never smaller than **18 pt** (except footer)
- [ ] Logo on Slide 1 and Slide 10
- [ ] No red for “missed workout” messaging
- [ ] Numbers match application (500 paying, $6K MRR, $20K ask, June 8, 258 commits)
- [ ] Export **PDF** (Print quality)

---

## Presenter notes (paste into Canva Notes — not visible in PDF)

**Total live pitch:** ~4–5 minutes at 25–30 sec per slide.  
**Video script** (2:45, talking head): see `forgeRep-grant-playbook.md` → *2–3 Minute Pitch Video*.

---

### Slide 1 — Title (~25 sec)

> "Hi, I'm Christopher Kendig, founder of ForgeRep, based in Fort Myers. ForgeRep is evidence-based fitness that works offline — programs, macros, and progress grounded in science, not bro-science. The product is live at forge-rep.com, billing is on Stripe, and I'm here because we're ready to scale customer acquisition — not build more features."

**Tip:** Smile, make eye contact, don't rush the headline.

---

### Slide 2 — The Problem (~30 sec)

> "Raise your hand if you use more than one fitness app. Most serious lifters do. MyFitnessPal for macros, Strong for sets, maybe a spreadsheet for progress — and context gets lost between them. Gyms break cloud-only apps: basement racks, dead zones, sessions die mid-set. And 'AI workout' generators can't cite their logic. That's a ten-billion-dollar market where retention is still broken — and that's the gap we're filling."

**Tip:** Pause after "raise your hand" even on video — it engages judges.

---

### Slide 3 — The Solution (~25 sec)

> "ForgeRep is one app: evidence-based programming, integrated nutrition, progress projections, and Pro-tier community accountability — all offline in the gym. Four pillars: programs backed by thirty-plus peer-reviewed citations, not opaque AI; workout logging that works with zero signal; macros tied to your plan, not a separate calculator; and community that encourages without shame. It's a progressive web app — installs like native, no App Store gate."

**Tip:** Point to each pillar card as you name it; don't read subtext verbatim.

---

### Slide 4 — Product Demo (~30 sec)

> "Let me show you the product — this is the real app, not mockups. Left: active workout logging with rest timers — I use this in my gym with no cell service. Center: tap any progression rule and see the actual study behind it. Right: projections that answer the question every lifter asks — 'Am I on pace for my goal?' This is what judges can verify live at forge-rep.com."

**Tip:** Slow down here. Let screenshots breathe. Offer live demo in Q&A.

---

### Slide 5 — How It Works (~25 sec)

> "The journey is simple. Sign up, seven-step onboarding, first workout in under ten minutes — that's our MVP metric. Log sets offline in the gym; everything syncs when you're back online. The upgrade moment is natural: when a free user hits the thirty-day projection limit, they see their goal date behind Pro — that's when conversion happens. Free tier is a complete training loop; Pro unlocks ninety-day intelligence and community."

**Tip:** Trace the timeline with your finger or cursor.

---

### Slide 6 — Market (~25 sec)

> "The global fitness app market is over ten billion dollars, but we're not trying to boil the ocean. Our serviceable market is about twenty-five million English-speaking serious lifters — people who train three to five times a week and already pay eight to fifteen dollars a month for fragmented tools. Our beachhead is organic social and micro-influencers. Our ideal customer is Alex: thirty-two, trains four times a week, used MFP and Strong, wants one system. We win on trust and retention — not feature breadth."

**Tip:** Emphasize SAM, not TAM — judges know TAM slides are inflated.

---

### Slide 7 — Business Model (~30 sec)

> "Freemium SaaS with three tiers. Free is generous — full training loop, no credit card. Pro at eight ninety-nine a month is our core revenue tier: ninety-day projections, strength analytics, unlimited history, and community. Pro+ at fourteen ninety-nine adds wearable sync, restaurant quick-log, and AI coaching copy — never workout generation. Blended ARPU is about eleven ninety with eighty-two to ninety-four percent contribution margins. We're bootstrapped and won't scale paid ads until retention proves out."

**Tip:** Physically gesture at the Pro card — "this is where the money is."

---

### Slide 8 — Traction & Readiness (~30 sec)

> "We're not a slide deck — we're at TRL eight with a production PWA live. CRL five moving to six with our Q3 public launch. First commit was June eighth, twenty twenty-six. In under one month — two hundred fifty-eight commits, AI-assisted throughout — I shipped offline logging, the evidence knowledge base, Stripe billing, community, and Fitbit sync. Billing is live. I'm dogfooding on production today. External cohort starts at launch."

**Tip:** "June 8" and "under one month" are your credibility anchors — say them clearly.

---

### Slide 9 — Competition (~35 sec)

> "MyFitnessPal is great at food. Strong is great at logging. Fitbod is great at convenience. MacroFactor is great at nutrition science. But our customer still juggles two or three apps. Look at the table — ForgeRep is the only full checkmark column: evidence programs, integrated macros and training, reliable offline logging, projections with a goal date, and community accountability. Our moat is the unified loop, offline-first architecture, and a deterministic evidence engine — AI never picks your exercises."

**Tip:** Respectful tone. "Great at X, weak at Y" — never trash-talk.

---

### Slide 10 — The Ask (~30 sec)

> "We're not asking you to fund R&D — the product ships today. A pitchGNV prize goes one hundred percent to customer acquisition: eight thousand for micro-influencer Reels, six thousand for paid social tests, four thousand for annual-plan promotions, two thousand for referrals. No executive comp, no overhead. Twelve-month goal: five hundred paying subscribers, about six thousand dollars MRR. Scan the QR — try it offline in a dead zone. I'm Christopher Kendig. Train with intention. Thank you."

**Tip:** End strong, hold eye contact, offer to demo. Don't rush the thank-you.

---

### Quick-reference table (one-liners)

| Slide | One-line cue |
|-------|----------------|
| 1 | Hook: offline + evidence. Introduce yourself. |
| 2 | "Raise hand if you use more than one fitness app." |
| 3 | Four pillars — don't read subtext verbatim. |
| 4 | Pause on screenshots. "Works in my gym with no signal." |
| 5 | Emphasize <10 min to first workout. |
| 6 | SAM is your wedge — serious lifters, not all $10B TAM. |
| 7 | Pro is the money tier; margins matter for bootstrap. |
| 8 | "First commit June 8 — under a month, AI-assisted." |
| 9 | Respect competitors; ForgeRep owns the full loop. |
| 10 | Clear ask. Offer live demo. |

---

## Quick reference — all slide titles

1. Evidence-Based Fitness That Works Offline  
2. The Problem  
3. The Solution  
4. Product Demo  
5. How It Works  
6. Market Opportunity  
7. Business Model  
8. Traction & Readiness  
9. Competitive Landscape  
10. The Ask  

---

*Pair with `docs/business/forgeRep-grant-playbook.md` for application copy and video script.*
