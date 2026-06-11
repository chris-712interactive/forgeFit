-- Record when the user accepted the health disclaimer during onboarding.

alter table public.profiles
  add column if not exists health_disclaimer_accepted_at timestamptz;
