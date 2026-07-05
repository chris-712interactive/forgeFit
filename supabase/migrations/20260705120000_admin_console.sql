-- Admin console: operator role, comp billing fields, audit log

alter table public.profiles
  add column if not exists is_admin boolean not null default false,
  add column if not exists billing_source text
    check (billing_source is null or billing_source in ('stripe', 'comp')),
  add column if not exists comp_reason text,
  add column if not exists comp_expires_at timestamptz;

comment on column public.profiles.is_admin is
  'ForgeRep operator — access to /admin console. Also seed via ADMIN_USER_IDS env.';
comment on column public.profiles.billing_source is
  'stripe = paid via Stripe webhook sync; comp = admin-granted access without charge.';
comment on column public.profiles.comp_reason is
  'Required note when billing_source is comp (partnership, beta, support, etc.).';
comment on column public.profiles.comp_expires_at is
  'When set, comp tier reverts to free after this timestamp.';

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.profiles (id) on delete cascade,
  action text not null,
  target_user_id uuid references public.profiles (id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_at_idx
  on public.admin_audit_log (created_at desc);

create index if not exists admin_audit_log_target_user_id_idx
  on public.admin_audit_log (target_user_id)
  where target_user_id is not null;

alter table public.admin_audit_log enable row level security;

-- No policies: admin UI uses service role only.
