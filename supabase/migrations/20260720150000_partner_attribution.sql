-- Phase 14A: Partner attribution (gyms, influencers, affiliates)
-- Commission ledger (partner_commissions / partner_payouts) ships in Phase 14B.

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  type text not null
    check (type in ('gym', 'influencer', 'affiliate', 'referral', 'other')),
  display_name text not null,
  status text not null default 'active'
    check (status in ('pending', 'active', 'paused', 'terminated')),
  contact_email text,
  payout_method text not null default 'manual'
    check (payout_method in ('manual', 'stripe_connect')),
  default_landing_path text not null default '/signup',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partners_slug_format check (slug ~ '^[a-z0-9][a-z0-9_-]{1,62}$'),
  constraint partners_slug_unique unique (slug)
);

comment on table public.partners is
  'Acquisition partners: gyms, influencers, affiliates. Rev-share deals live in partner_deals.';

create table if not exists public.partner_deals (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners (id) on delete cascade,
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  commission_type text not null default 'percent'
    check (commission_type in ('percent', 'cpa', 'hybrid')),
  commission_base text not null default 'net_of_fees'
    check (commission_base in ('gross', 'net_of_fees', 'net_of_fees_and_tax')),
  percent_bps integer
    check (percent_bps is null or (percent_bps >= 0 and percent_bps <= 10000)),
  cpa_cents integer
    check (cpa_cents is null or cpa_cents >= 0),
  -- null = life of the subscription (earn on paid invoices until cancel)
  duration_months integer
    check (duration_months is null or duration_months > 0),
  click_window_days integer not null default 30
    check (click_window_days > 0 and click_window_days <= 365),
  attribution_model text not null default 'first_touch'
    check (attribution_model in ('first_touch', 'last_touch')),
  eligible_tiers text[] not null default array['pro', 'pro_plus']::text[],
  notes text,
  created_at timestamptz not null default now(),
  constraint partner_deals_percent_required check (
    commission_type = 'cpa'
    or percent_bps is not null
  ),
  constraint partner_deals_cpa_required check (
    commission_type = 'percent'
    or cpa_cents is not null
  )
);

comment on column public.partner_deals.duration_months is
  'Months of paid residual after attribution. NULL = life of the subscription.';
comment on column public.partner_deals.commission_base is
  'gross = amount paid; net_of_fees = paid − Stripe fees; net_of_fees_and_tax also subtracts tax.';
comment on column public.partner_deals.percent_bps is
  'Basis points: 2000 = 20%.';

create index if not exists partner_deals_partner_id_idx
  on public.partner_deals (partner_id, effective_from desc);

create table if not exists public.partner_codes (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners (id) on delete cascade,
  code text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint partner_codes_code_format check (code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'),
  constraint partner_codes_code_unique unique (code)
);

comment on table public.partner_codes is
  'Human promo codes (e.g. EOS20, ALEX) mapped to a partner.';

create table if not exists public.attribution_events (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners (id) on delete cascade,
  partner_code_id uuid references public.partner_codes (id) on delete set null,
  visitor_id text not null,
  user_id uuid references public.profiles (id) on delete set null,
  source text not null default 'link'
    check (source in ('link', 'code', 'deep_link', 'admin_override')),
  landing_url text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists attribution_events_visitor_id_idx
  on public.attribution_events (visitor_id, created_at desc);
create index if not exists attribution_events_partner_id_idx
  on public.attribution_events (partner_id, created_at desc);
create index if not exists attribution_events_user_id_idx
  on public.attribution_events (user_id)
  where user_id is not null;

create table if not exists public.user_attributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  partner_id uuid not null references public.partners (id) on delete restrict,
  partner_code_id uuid references public.partner_codes (id) on delete set null,
  deal_id uuid references public.partner_deals (id) on delete set null,
  attribution_model text not null default 'first_touch'
    check (attribution_model in ('first_touch', 'last_touch')),
  source text not null default 'link'
    check (source in ('link', 'code', 'deep_link', 'admin_override')),
  attributed_at timestamptz not null default now(),
  click_expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  constraint user_attributions_user_unique unique (user_id)
);

comment on table public.user_attributions is
  'Durable acquisition partner stamp per user (first-touch default). One row per user.';

create index if not exists user_attributions_partner_id_idx
  on public.user_attributions (partner_id);

alter table public.profiles
  add column if not exists acquisition_partner_id uuid
    references public.partners (id) on delete set null;

comment on column public.profiles.acquisition_partner_id is
  'Denormalized partner from user_attributions for admin filters. Not signup_source (prior app).';

create index if not exists profiles_acquisition_partner_id_idx
  on public.profiles (acquisition_partner_id)
  where acquisition_partner_id is not null;

alter table public.partners enable row level security;
alter table public.partner_deals enable row level security;
alter table public.partner_codes enable row level security;
alter table public.attribution_events enable row level security;
alter table public.user_attributions enable row level security;

-- No member policies: writes via service role (redirect, claim API, admin).
-- Members may read their own attribution (optional transparency).
create policy "user_attributions_select_own"
  on public.user_attributions
  for select
  using (user_id = auth.uid());
