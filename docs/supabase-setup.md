# Supabase Setup (Phase 1)

## 1. Create project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Copy **Project URL** and **anon public** key from Settings → API.

## 2. Environment

```bash
cp .env.example apps/web/.env.local
# Edit apps/web/.env.local with your URL and anon key
```

## 3. Run migration

Install [Supabase CLI](https://supabase.com/docs/guides/cli) and link your project:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Or paste the SQL from `supabase/migrations/20260608160000_phase1_profiles_onboarding.sql` into the SQL Editor.

## 4. Auth providers

**Authentication → Providers:**

- Enable **Email** (confirm email optional for dev)
- Enable **Google** — add OAuth client ID/secret from Google Cloud Console

**Authentication → URL Configuration:**

- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/callback`

## 5. Verify

```bash
pnpm dev
```

1. Visit `/signup` → create account
2. Complete 7-step onboarding
3. Land on `/home` with bottom nav
