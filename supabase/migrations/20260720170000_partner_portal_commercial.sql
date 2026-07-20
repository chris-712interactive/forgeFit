-- Phase 14C + commercial leftovers: payout policy, tax forms, partner portal access

alter table public.partners
  add column if not exists payout_minimum_cents integer not null default 5000
    check (payout_minimum_cents >= 0),
  add column if not exists payout_net_days integer not null default 30
    check (payout_net_days >= 0 and payout_net_days <= 120),
  add column if not exists tax_form_status text not null default 'none'
    check (tax_form_status in ('none', 'received', 'verified')),
  add column if not exists tax_form_received_at timestamptz;

comment on column public.partners.payout_minimum_cents is
  'Minimum payable balance (cents) before Mark paid is allowed. Default $50.';
comment on column public.partners.payout_net_days is
  'Days after period month end before payout is allowed (Net-N). Default 30.';
comment on column public.partners.tax_form_status is
  'W-9 / tax form gate: none | received | verified. Payout blocked while none.';

create table if not exists public.partner_portal_users (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  constraint partner_portal_users_user_unique unique (user_id),
  constraint partner_portal_users_partner_user_unique unique (partner_id, user_id)
);

comment on table public.partner_portal_users is
  'Supabase Auth users allowed to view the read-only partner portal for one partner.';

create index if not exists partner_portal_users_partner_id_idx
  on public.partner_portal_users (partner_id);

alter table public.partner_portal_users enable row level security;

-- Portal users can read their own membership row (dashboard uses service role for aggregates).
create policy "partner_portal_users_select_own"
  on public.partner_portal_users
  for select
  using (user_id = auth.uid());
