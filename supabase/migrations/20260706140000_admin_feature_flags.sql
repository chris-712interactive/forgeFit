-- Admin console Phase D: per-user feature flag overrides

alter table public.profiles
  add column if not exists admin_feature_flags jsonb not null default '{}'::jsonb;

comment on column public.profiles.admin_feature_flags is
  'Operator-set feature flag overrides (key → boolean). Checked via lib/admin/feature-flags.ts.';
