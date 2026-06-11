export const PRIVACY_POLICY = {
  title: "Privacy Policy",
  updated: "June 9, 2026",
  sections: [
    {
      heading: "Overview",
      body: "forgeFit helps you track workouts, nutrition, and body measurements. This policy describes what we collect, why we use it, and the choices you have.",
    },
    {
      heading: "Information we collect",
      body: "Account details (email), profile and onboarding answers (goals, measurements, equipment), workout logs, nutrition entries, body measurements, and technical data needed to operate the app (session cookies, sync metadata).",
    },
    {
      heading: "How we use information",
      body: "We use your data to generate training and nutrition plans, display progress, sync across devices, and improve reliability. We do not sell your personal information.",
    },
    {
      heading: "Storage and security",
      body: "Data is stored in Supabase (PostgreSQL) with row-level security tied to your account. Workout data is also cached locally on your device for offline use.",
    },
    {
      heading: "Your choices",
      body: "You can export your account data or permanently delete your account from Profile → Privacy & data. Deletion removes your profile, plans, logs, and related records.",
    },
    {
      heading: "Contact",
      body: "Questions about privacy? Contact the forgeFit team through the support channel listed in the app or on the marketing site.",
    },
  ],
} as const;

export const TERMS_OF_USE = {
  title: "Terms of Use",
  updated: "June 9, 2026",
  sections: [
    {
      heading: "Agreement",
      body: "By creating an account or using forgeFit, you agree to these Terms of Use and our Privacy Policy.",
    },
    {
      heading: "Informational purpose only",
      body: "forgeFit provides educational fitness and nutrition information. It is not medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional before starting or changing an exercise or nutrition program, especially if you have a health condition, injury, or take prescription medications.",
    },
    {
      heading: "Your responsibility",
      body: "You are responsible for using forgeFit safely. Stop any activity that causes pain, dizziness, or other concerning symptoms. You use the service at your own risk.",
    },
    {
      heading: "Accounts",
      body: "Keep your login credentials secure. You are responsible for activity under your account.",
    },
    {
      heading: "Acceptable use",
      body: "Do not misuse the service, attempt unauthorized access, or interfere with other users. We may suspend accounts that violate these terms.",
    },
    {
      heading: "Changes",
      body: "We may update these terms as the product evolves. Material changes will be reflected in the updated date above.",
    },
  ],
} as const;
