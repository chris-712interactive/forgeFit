export interface LegalLink {
  label: string;
  href: string;
}

export interface LegalSection {
  id?: string;
  heading: string;
  paragraphs: readonly string[];
  links?: readonly LegalLink[];
}

export const PRIVACY_POLICY = {
  title: "Privacy Policy",
  updated: "June 11, 2026",
  sections: [
    {
      heading: "Overview",
      paragraphs: [
        "ForgeRep helps you track workouts, nutrition, and body measurements. This policy describes what we collect, why we use it, and the choices you have.",
      ],
    },
    {
      heading: "Information we collect",
      paragraphs: [
        "Account details (email), profile and onboarding answers (goals, measurements, equipment), workout logs, nutrition entries, body measurements, progress photos (if you upload them), and technical data needed to operate the app (session cookies, sync metadata).",
        "If you subscribe to Pro or Pro+, we store billing status from Stripe (tier, renewal date, cancellation state). We do not store full payment card numbers.",
      ],
    },
    {
      id: "integrations",
      heading: "Third-party integrations (Pro+)",
      paragraphs: [
        "Connecting a device or app is optional. When you choose to connect, you are redirected to that provider to sign in and approve access. We only receive the data needed for the integration you enable.",
        "Withings (available when enabled): we store encrypted OAuth tokens and import weight readings into your ForgeRep Progress log. We do not receive your Withings password. Disconnecting removes our stored tokens; previously imported measurements remain until you delete them or delete your account.",
        "Fitbit and Strava are planned integrations. When available, they will follow the same pattern: you authorize access, we import agreed data types, and you can disconnect at any time from Profile → Integrations.",
        "Third-party providers process data under their own privacy policies and terms. ForgeRep is not responsible for how those services handle your data outside the connection you approve.",
      ],
      links: [
        {
          label: "Withings Privacy Policy",
          href: "https://www.withings.com/legal/privacy-policy",
        },
        {
          label: "Fitbit Privacy Policy",
          href: "https://www.fitbit.com/global/us/legal/privacy-policy",
        },
        {
          label: "Strava Privacy Policy",
          href: "https://www.strava.com/legal/privacy",
        },
      ],
    },
    {
      heading: "How we use information",
      paragraphs: [
        "We use your data to generate training and nutrition plans, display progress, sync across devices, run optional device integrations, process subscriptions, and improve reliability. We do not sell your personal information.",
      ],
    },
    {
      heading: "Storage and security",
      paragraphs: [
        "Data is stored in Supabase (PostgreSQL) with row-level security tied to your account. Integration OAuth tokens are encrypted at rest before storage. Workout data is also cached locally on your device for offline use.",
        "Payment processing is handled by Stripe. Subscription webhooks update your account tier; we do not store card details on our servers.",
      ],
    },
    {
      heading: "Your choices",
      paragraphs: [
        "You can export your account data or permanently delete your account from Profile → Privacy & data. Deletion removes your profile, plans, logs, integration tokens, and related records.",
        "You can disconnect any integration from Profile → Integrations without deleting your ForgeRep account.",
      ],
    },
    {
      heading: "Contact",
      paragraphs: [
        "Questions about privacy? Contact the ForgeRep team through the support channel listed in the app or on the marketing site.",
      ],
    },
  ] satisfies readonly LegalSection[],
} as const;

export const TERMS_OF_USE = {
  title: "Terms of Use",
  updated: "June 11, 2026",
  sections: [
    {
      heading: "Agreement",
      paragraphs: [
        "By creating an account or using ForgeRep, you agree to these Terms of Use and our Privacy Policy.",
      ],
    },
    {
      heading: "Informational purpose only",
      paragraphs: [
        "ForgeRep provides educational fitness and nutrition information. It is not medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional before starting or changing an exercise or nutrition program, especially if you have a health condition, injury, or take prescription medications.",
      ],
    },
    {
      heading: "Your responsibility",
      paragraphs: [
        "You are responsible for using ForgeRep safely. Stop any activity that causes pain, dizziness, or other concerning symptoms. You use the service at your own risk.",
      ],
    },
    {
      id: "third-party-services",
      heading: "Third-party services",
      paragraphs: [
        "ForgeRep may link to or integrate with third-party services (for example Withings, Fitbit, Strava, Stripe, or nutrition data providers). Those services are operated by their respective companies under their own terms and privacy policies.",
        "When you connect an integration, you authorize ForgeRep to access only the data types described in our Privacy Policy for that connector. You can revoke access by disconnecting in Profile → Integrations or through the provider's account settings where applicable.",
        "We do not guarantee the availability, accuracy, or security of third-party services. Outages or changes on a provider's side may affect sync until resolved.",
      ],
    },
    {
      heading: "Subscriptions and billing",
      paragraphs: [
        "Paid plans (Pro and Pro+) renew automatically until canceled. Manage or cancel from Profile → Subscription or through the Stripe Customer Portal. Refunds follow Stripe and app-store policies where applicable.",
      ],
    },
    {
      heading: "Accounts",
      paragraphs: [
        "Keep your login credentials secure. You are responsible for activity under your account.",
      ],
    },
    {
      heading: "Acceptable use",
      paragraphs: [
        "Do not misuse the service, attempt unauthorized access, or interfere with other users. We may suspend accounts that violate these terms.",
      ],
    },
    {
      heading: "Changes",
      paragraphs: [
        "We may update these terms as the product evolves. Material changes will be reflected in the updated date above.",
      ],
    },
  ] satisfies readonly LegalSection[],
} as const;
