import type { SeoArticle } from "./types";

export const guideArticles: readonly SeoArticle[] = [
  {
    slug: "functional-conditioning-app",
    category: "guide",
    title: "Functional Conditioning App: Strength + Circuits in One Plan",
    description:
      "What to look for in a functional conditioning app — hybrid strength and metabolic circuits, AMRAP time caps, offline logging, and evidence-based programming (not random WOD generators).",
    keywords: [
      "functional conditioning app",
      "functional fitness app",
      "metabolic conditioning program",
      "circuit training app",
      "strength and conditioning app",
      "mixed modal training app",
    ],
    publishedAt: "2026-07-06",
    updatedAt: "2026-07-06",
    readTimeMinutes: 5,
    relatedSlugs: ["evidence-based-workout-program", "offline-workout-tracker"],
    sections: [
      {
        id: "what-is-functional-conditioning",
        heading: "What functional conditioning means in ForgeRep",
        paragraphs: [
          "Functional conditioning combines resistance training with metabolic circuits — compound strength on most days, plus dedicated mixed-modal sessions that raise work capacity without replacing progressive overload.",
          "ForgeRep uses generic training language (functional conditioning, metabolic conditioning, circuit training). We do not use branded mixed-modal gym trademarks or imply official affiliation.",
        ],
      },
      {
        id: "what-to-look-for",
        heading: "What a good functional conditioning app should include",
        paragraphs: [
          "The best apps combine periodized strength work with planned conditioning — not a new random circuit every day.",
        ],
        bullets: [
          "Hybrid weekly split — strength patterns plus scheduled conditioning days, not random daily workouts",
          "Structured circuits — fixed rounds for consistency and AMRAP time caps for pace work",
          "Optional finishers — short metabolic blocks after main lifts on strength-focused goals",
          "Offline logging — circuits and sets saved locally in the gym",
          "Evidence-backed volume — rules for rounds, rest, and recovery tied to experience level",
        ],
      },
      {
        id: "forgerep",
        heading: "How ForgeRep approaches functional conditioning",
        paragraphs: [
          "Select Functional conditioning as your primary goal in onboarding. The program engine builds strength days with a high functional movement bias, plus conditioning circuits scaled to your equipment and session length.",
          "Explore the dedicated overview at /functional-conditioning or start free and generate your first hybrid week in minutes.",
        ],
      },
    ],
  },
  {
    slug: "offline-workout-tracker",
    category: "guide",
    title: "Offline Workout Tracker for the Gym (No Signal Required)",
    description:
      "Why basement gyms and dead zones break most fitness apps — and what to look for in an offline workout tracker that logs sets, reps, and rest timers without WiFi.",
    keywords: [
      "offline workout tracker",
      "gym app no wifi",
      "workout log offline",
      "offline fitness app",
      "workout tracker no signal",
      "PWA workout app",
    ],
    publishedAt: "2026-06-28",
    updatedAt: "2026-06-28",
    readTimeMinutes: 6,
    relatedSlugs: [
      "progressive-overload-tracker",
      "forgeRep-vs-strong",
      "forgeRep-vs-hevy",
    ],
    sections: [
      {
        id: "problem",
        heading: "Why gym WiFi fails when you need your app most",
        paragraphs: [
          "Every serious lifter has been there: you're mid-session in a basement gym, parking-garage fitness center, or crowded commercial gym where the signal dies between racks. You open your workout tracker and get a spinning loader, a login prompt, or — worse — a blank screen that loses the set you just finished.",
          "Most fitness apps assume always-on connectivity. They fetch exercise libraries on demand, require account checks before every set, or store your active session only in memory. That architecture works fine at home. In a real gym, it fails exactly when logging matters most: between sets, during rest timers, when you need to know what weight you hit last week.",
        ],
      },
      {
        id: "what-to-look-for",
        heading: "What an offline-first workout tracker actually needs",
        paragraphs: [
          "An offline-capable gym app is not the same as an app that \"sometimes works without signal.\" Offline-first means your session is saved locally first, synced later — and the core loop never depends on a network round-trip.",
        ],
        bullets: [
          "Local storage for active workouts — sets, reps, weight, RIR, and rest timers persist even if you force-quit the app",
          "Exercise library cached on device — no API call required to look up form cues or substitutions",
          "Background sync when connectivity returns — merge conflicts handled cleanly, not by overwriting your log",
          "Progressive web app (PWA) install — add to home screen for app-like reliability without an app store download",
          "No paywall on basic logging — offline logging should not require a premium tier",
        ],
      },
      {
        id: "forgeRep-approach",
        heading: "How ForgeRep handles offline gym sessions",
        paragraphs: [
          "ForgeRep is built as a mobile-first progressive web app with IndexedDB-backed workout storage. When you start a session, every set logs locally immediately. Rest timers, RIR-based load suggestions, and exercise substitutions all work without connectivity.",
          "When you leave the gym and signal returns, your session syncs automatically. Your home dashboard, weekly volume totals, and progression charts update — without you doing anything. The same offline pattern applies to your personalized program schedule: you always know what today's workout is, even in airplane mode.",
          "This matters because consistency beats perfection. If your app friction costs you one logged set per session, your training history becomes unreliable — and unreliable history breaks progressive overload.",
        ],
      },
      {
        id: "who-benefits",
        heading: "Who benefits most from offline workout logging",
        paragraphs: [
          "Commercial gym members in concrete buildings, home gym lifters with spotty rural broadband, travelers training in hotel fitness centers, and anyone who refuses to tether their workout to gym WiFi all need offline reliability.",
          "If you've ever re-typed a workout from notes after a failed session, or skipped logging because the app wouldn't load, an offline-first tracker removes that friction entirely.",
        ],
      },
    ],
  },
  {
    slug: "evidence-based-workout-program",
    category: "guide",
    title: "Evidence-Based Workout Programs: What to Look For",
    description:
      "Random templates and AI-generated workouts dominate fitness apps. Learn how to spot evidence-based programming — volume ranges, protein targets, deload timing, and citable rules.",
    keywords: [
      "evidence based workout program",
      "science based training program",
      "evidence based fitness app",
      "hypertrophy volume research",
      "periodized workout plan",
      "sports science training",
    ],
    publishedAt: "2026-06-28",
    updatedAt: "2026-06-28",
    readTimeMinutes: 7,
    relatedSlugs: [
      "progressive-overload-tracker",
      "forgeRep-vs-fitbod",
      "macro-tracking-strength-training",
    ],
    sections: [
      {
        id: "hype-vs-science",
        heading: "The gap between Instagram programs and sports science",
        paragraphs: [
          "Most app-store workout plans are either generic templates — same split for every user — or opaque \"AI workouts\" that change daily with no explainable logic. Neither approach scales volume, recovery, or nutrition to your goal, experience, or schedule.",
          "Evidence-based programming means the rules behind your plan trace to peer-reviewed research: hypertrophy volume landmarks, deficit rates for fat loss, protein targets for muscle retention, and deload timing to manage fatigue. The plan should be explainable, not magical.",
        ],
      },
      {
        id: "hallmarks",
        heading: "Hallmarks of an evidence-based training program",
        bullets: [
          "Volume scaled to experience — beginners need less stimulus; intermediates target research-backed set ranges per muscle group per week",
          "Periodization built in — progression blocks, deload weeks every ~6 training weeks, and recovery sessions in every plan",
          "Goal-specific nutrition — protein, deficit/surplus rate, and macro splits derived from your body weight and training load, not a one-size 2000-calorie default",
          "Explainable exercise selection — substitutions when equipment is busy, not random swaps",
          "Deterministic logic — same inputs produce the same structure; workouts are not LLM-generated each morning",
          "Citations available — the app can point to the sports science principles behind its rules",
        ],
        paragraphs: [
          "If an app cannot tell you why today's session has four exercises instead of six, or why your protein target is 180g instead of 120g, it is not evidence-based — it is marketing.",
        ],
      },
      {
        id: "forgeRep-engine",
        heading: "How ForgeRep applies evidence rules",
        paragraphs: [
          "ForgeRep's program engine is deterministic and sourced from a curated evidence knowledge base — 30+ peer-reviewed rules covering hypertrophy volume, strength progression, fat-loss rate, protein intake, and recovery timing. Program structure is never written by an LLM.",
          "Onboarding captures your goal, experience, equipment, schedule, and measurements. The engine generates a periodized plan matched to those inputs: hypertrophy sessions scale to 10–20 hard sets per muscle group per week, strength blocks prioritize compounds, and deload weeks arrive automatically.",
          "Nutrition targets pull from the same engine — your daily macros align with your training plan, not a disconnected online calculator. That integration is what separates a training program from a workout generator.",
        ],
      },
      {
        id: "red-flags",
        heading: "Red flags when evaluating any fitness app",
        bullets: [
          "\"AI personal trainer\" with no explanation of progression rules",
          "Daily random workouts with no periodization or deload structure",
          "Same template for cutting and bulking with only calorie changes",
          "No connection between training volume and nutrition targets",
          "Celebrity or influencer programs with no sports science sourcing",
        ],
        paragraphs: [
          "Trustworthy apps welcome scrutiny. If the logic is hidden, assume it is optimized for engagement — not your results.",
        ],
      },
    ],
  },
  {
    slug: "macro-tracking-strength-training",
    category: "guide",
    title: "Macro Tracking for Strength Training: Beyond Generic Calculators",
    description:
      "Generic macro calculators ignore training volume and goal context. Learn how lifters should set protein, carbs, and fat targets — and why your tracker should connect to your program.",
    keywords: [
      "macro tracking for lifters",
      "macro tracker strength training",
      "protein target calculator gym",
      "macro counting app bodybuilding",
      "nutrition tracking workout plan",
      "macro tracker app",
    ],
    publishedAt: "2026-06-28",
    updatedAt: "2026-06-28",
    readTimeMinutes: 6,
    relatedSlugs: [
      "evidence-based-workout-program",
      "forgeRep-vs-myfitnesspal",
      "forgeRep-vs-macrofactor",
    ],
    sections: [
      {
        id: "calculator-problem",
        heading: "Why generic macro calculators fall short for lifters",
        paragraphs: [
          "Most online macro calculators ask for age, weight, height, and activity level — then output a calorie target with a generic 30/40/30 split. That works for sedentary weight loss. It fails for someone running a 5-day hypertrophy block at maintenance or a moderate deficit cut while preserving lean mass.",
          "Strength trainees need protein anchored to body weight and goal, carbs scaled to training volume, and deficit rates that respect muscle retention research — not a single \"moderately active\" multiplier applied to everyone who clicks \"gym 3–5 days.\"",
        ],
      },
      {
        id: "what-matters",
        heading: "What actually matters for lifting nutrition",
        bullets: [
          "Protein — typically 1.6–2.2 g/kg for muscle gain or retention during a cut; tied to lean mass, not a flat 150g default",
          "Energy balance — deficit rate matched to goal (fat loss vs recomposition); aggressive cuts sacrifice muscle and recovery",
          "Carb timing — higher carbs on training days support performance; rest-day targets can differ",
          "Adherence visibility — daily progress bars against your plan targets, not just a calorie ring",
          "Integration with training — when your program deloads or volume drops, nutrition context should reflect that",
        ],
        paragraphs: [
          "Tracking macros without a program connection tells you what you ate. Tracking macros against program targets tells you whether you're on pace for your goal.",
        ],
      },
      {
        id: "forgeRep-nutrition",
        heading: "How ForgeRep connects macros to your training plan",
        paragraphs: [
          "ForgeRep sets daily protein, carbohydrate, and fat targets from your personalized program — goal, body weight, training volume, and experience all factor in. The same evidence engine that builds your workouts sets your nutrition targets.",
          "Log whole foods from the curated library throughout the day. Your home dashboard shows macro progress alongside this week's workouts and volume — one screen for training and nutrition accountability.",
          "Pro members unlock deeper analytics: nutrition adherence trends, 90-day weight projections with confidence bands, and adaptive TDEE inference from intake and scale trends. Pro+ adds restaurant quick-log and saved meals for real-world eating.",
        ],
      },
      {
        id: "practical-tips",
        heading: "Practical tips for macro tracking that sticks",
        bullets: [
          "Weigh protein sources consistently — the biggest lever for body composition",
          "Log before you eat when possible — retrospective logging underestimates intake",
          "Use saved meals for repeat breakfasts and meal prep — reduces friction",
          "Review weekly trends, not single days — one high day does not ruin a cut",
          "Pair scale weight with measurements — the program is working even when the scale stalls",
        ],
        paragraphs: [
          "The best macro tracker is the one you open every day. Connecting it to your workout plan — on the same home screen — makes that habit much easier to maintain.",
        ],
      },
    ],
  },
  {
    slug: "progressive-overload-tracker",
    category: "guide",
    title: "How to Track Progressive Overload Without a Spreadsheet",
    description:
      "Progressive overload is the foundation of strength and hypertrophy. Learn how to track weight, reps, and RIR over time — and why your workout app should do the math for you.",
    keywords: [
      "progressive overload tracker",
      "track progressive overload app",
      "workout progression app",
      "strength progression tracker",
      "RIR tracking app",
      "volume tracking gym",
    ],
    publishedAt: "2026-06-28",
    updatedAt: "2026-06-28",
    readTimeMinutes: 5,
    relatedSlugs: [
      "offline-workout-tracker",
      "evidence-based-workout-program",
      "forgeRep-vs-strong",
    ],
    sections: [
      {
        id: "what-is-overload",
        heading: "What progressive overload actually means",
        paragraphs: [
          "Progressive overload is the gradual increase of stress placed on the body during training — more weight, more reps, more sets, or better execution at the same load (lower RIR). Without tracking, you're guessing whether last month was harder than this month.",
          "Spreadsheets work for meticulous lifters. Most people abandon them within six weeks because logging between sets is already enough work — copying data into rows after the gym is a second job.",
        ],
      },
      {
        id: "what-to-track",
        heading: "The minimum data worth tracking",
        bullets: [
          "Weight and reps per set — the baseline for every progression decision",
          "RIR (reps in reserve) — distinguishes a true PR from grinding to failure inconsistently",
          "Volume per muscle group per week — total hard sets, not just one lift",
          "Session history — what you did last week for the same exercise, visible before you load the bar",
          "Trend charts — 4–8 week view of e1RM or top-set weight, not just last session",
        ],
        paragraphs: [
          "Your tracker should surface last session's numbers automatically when you start an exercise. If you're scrolling through notes or opening a spreadsheet, the tool is adding friction instead of removing it.",
        ],
      },
      {
        id: "forgeRep-progression",
        heading: "How ForgeRep tracks progression automatically",
        paragraphs: [
          "Every set you log in ForgeRep feeds volume totals, muscle-group heatmaps, and load progression suggestions based on RIR. Active workout mode shows your previous performance for each exercise before you start the set.",
          "Pro unlocks strength progression charts, PR history, and volume trend analytics — the long-horizon view that tells you whether your program is working over a full training block, not just one good day.",
          "Because ForgeRep logs offline and syncs later, you never skip a set because the app would not load. Incomplete history breaks progression tracking; offline-first logging keeps the data chain intact.",
        ],
      },
      {
        id: "common-mistakes",
        heading: "Common progression tracking mistakes",
        bullets: [
          "Adding weight every session regardless of RIR — not every lift linearly progresses weekly",
          "Ignoring volume drops during a cut — strength may dip; track trends over 4+ weeks",
          "Switching exercises too often — no baseline to progress from",
          "Tracking only bench, squat, and deadlift — accessory volume drives hypertrophy",
        ],
        paragraphs: [
          "A good app handles the bookkeeping so you focus on execution. Progressive overload is simple in theory — the hard part is consistent logging over months.",
        ],
      },
    ],
  },
] as const;
